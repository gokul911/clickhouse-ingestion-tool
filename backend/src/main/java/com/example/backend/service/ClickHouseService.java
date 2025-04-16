package com.example.backend.service;

import com.clickhouse.jdbc.ClickHouseDataSource;
import com.example.backend.model.ConnectionDetails;
import com.example.backend.model.IngestionRequest;
import com.example.backend.model.JoinRequest;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.sql.*;
import java.util.*;

public class ClickHouseService {

    // 1. Test ClickHouse connection
    public boolean testConnection(ConnectionDetails details) {
        try (Connection conn = getConnection(details);
             Statement stmt = conn.createStatement()) {

            ResultSet rs = stmt.executeQuery("SELECT 1");
            return rs.next() && rs.getInt(1) == 1;

        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    // 2. Fetch tables from ClickHouse
    public List<String> fetchTables(ConnectionDetails details) throws SQLException {
        List<String> tables = new ArrayList<>();
        String query = "SHOW TABLES";

        try (Connection conn = getConnection(details);
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(query)) {

            while (rs.next()) {
                tables.add(rs.getString(1));
            }

        } catch (SQLException e) {
            e.printStackTrace();
            throw e;
        }

        return tables;
    }

    // 3. Fetch column names from table
    public List<String> fetchColumns(ConnectionDetails details) throws SQLException {
        List<String> columns = new ArrayList<>();
        String query = "SELECT * FROM " + details.getTable() + " LIMIT 1";

        try (Connection conn = getConnection(details);
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(query)) {

            ResultSetMetaData metaData = rs.getMetaData();
            for (int i = 1; i <= metaData.getColumnCount(); i++) {
                columns.add(metaData.getColumnName(i));
            }

        } catch (SQLException e) {
            e.printStackTrace();
            throw e;
        }

        return columns;
    }

    // 4. Perform ingestion (ClickHouse → File OR File → ClickHouse)
    public int performIngestion(IngestionRequest request) throws Exception {
        if ("clickhouse_to_file".equalsIgnoreCase(request.direction)) {
            return exportClickHouseToCsvFile(request);
        } else if ("file_to_clickhouse".equalsIgnoreCase(request.direction)) {
            // For JSON ingestion, we expect a filePath (the CSV file is already on disk)
            if (request.filePath == null || request.filePath.isEmpty()) {
                throw new IllegalArgumentException("File path is required for file-to-clickhouse ingestion.");
            }
            // Open a stream from the file at the given path and process it
            try (InputStream csvStream = new FileInputStream(request.filePath)) {
                return importCsvFileToClickHouse(csvStream, request.connection);
            }
        } else {
            throw new IllegalArgumentException("Unsupported direction: " + request.direction);
        }
    }

    // 4a. Export ClickHouse table to CSV
    private int exportClickHouseToCsvFile(IngestionRequest request) throws SQLException {
        ConnectionDetails details = request.connection;
        String columnList = String.join(", ", request.selectedColumns);
        String query = "SELECT " + columnList + " FROM " + details.getTable();
        String delimiter = request.delimiter != null ? request.delimiter : ",";

        try (Connection conn = getConnection(details);
            Statement stmt = conn.createStatement();
            ResultSet rs = stmt.executeQuery(query);
            PrintWriter writer = new PrintWriter(request.filePath)) {

            ResultSetMetaData meta = rs.getMetaData();
            int count = 0;

            // Write header
            for (int i = 1; i <= meta.getColumnCount(); i++) {
                writer.print(meta.getColumnName(i));
                if (i < meta.getColumnCount()) writer.print(delimiter);
            }
            writer.println();

            // Write rows
            while (rs.next()) {
                for (int i = 1; i <= meta.getColumnCount(); i++) {
                    writer.print(rs.getString(i));
                    if (i < meta.getColumnCount()) writer.print(delimiter);
                }
                writer.println();
                count++;
            }
            return count;

        } catch (FileNotFoundException e) {
            e.printStackTrace();
            throw new SQLException("Failed to write to file: " + request.filePath, e);
        } catch (SQLException e) {
            e.printStackTrace();
            throw e;
        }
    }

    // 4b. Import CSV file to ClickHouse table (auto-detect columns from header)
    public int importCsvFileToClickHouse(InputStream csvStream, ConnectionDetails details) throws Exception {
    int inserted = 0;
    String delimiter = ","; // default delimiter; you can modify if needed

    try (Connection conn = getConnection(details);
         Statement stmt = conn.createStatement();
         BufferedReader reader = new BufferedReader(new InputStreamReader(csvStream))) {

        // Read the header line to auto-detect columns
        String headerLine = reader.readLine();
        if (headerLine == null) {
            throw new SQLException("CSV file is empty");
        }
        String[] columns = headerLine.split(delimiter);

        // Base insert query
        String insertQuery = "INSERT INTO " + details.getTable() + " (" + String.join(", ", columns) + ") VALUES ";

        String line;
        while ((line = reader.readLine()) != null) {
            String[] values = line.split(delimiter);  // Adjust delimiter if necessary

            if (values.length != columns.length) {
                throw new SQLException("Mismatch between column count and value count in row: " + line);
            }

            // Build the value row for this line
            StringBuilder valueRow = new StringBuilder("(");
            for (int i = 0; i < values.length; i++) {
                valueRow.append("'").append(values[i].replace("'", "''")).append("'");
                if (i < values.length - 1) valueRow.append(",");
            }
            valueRow.append(")");

            // Build conditions for checking existence
            StringBuilder whereConditions = new StringBuilder();
            for (int i = 0; i < columns.length; i++) {
                if (i > 0) whereConditions.append(" AND ");
                whereConditions.append(columns[i])
                              .append(" = ")
                              .append("'")
                              .append(values[i].replace("'", "''"))
                              .append("'");
            }

            // Check if record already exists
            String checkQuery = "SELECT 1 FROM " + details.getTable() + 
                                " WHERE " + whereConditions.toString() + " LIMIT 1";
            ResultSet rs = stmt.executeQuery(checkQuery);
            
            // Insert only if the record doesn't exist
            if (!rs.next()) {
                stmt.execute(insertQuery + valueRow.toString());
                inserted++;
            }
            rs.close();
        }
        }
        return inserted;
    }

    // 5. Preview first 50 rows ( using LIMIT )
    public List<Map<String, Object>> previewData(ConnectionDetails details) throws SQLException {
        List<Map<String, Object>> preview = new ArrayList<>();
        String query = "SELECT * FROM " + details.getTable() + " LIMIT 50";

        try (Connection conn = getConnection(details);
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(query)) {

            ResultSetMetaData meta = rs.getMetaData();
            int colCount = meta.getColumnCount();

            while (rs.next()) {
                Map<String, Object> row = new LinkedHashMap<>();
                for (int i = 1; i <= colCount; i++) {
                    row.put(meta.getColumnName(i), rs.getObject(i));
                }
                preview.add(row);
            }

        } catch (SQLException e) {
            e.printStackTrace();
            throw e;
        }

        return preview;
    }

    // Constructs and executes the JOIN query based on the JoinRequest and returns the joined rows.
    public List<Map<String, Object>> executeJoin(JoinRequest request) throws Exception {
        ConnectionDetails details = request.getConnection();
        List<String> tables = request.getTables();
        if (tables == null || tables.size() < 2) {
            throw new IllegalArgumentException("At least two tables must be selected for joining.");
        }

        // Determine join type; use INNER JOIN as default if none is provided.
        String joinType = (request.getJoinType() == null || request.getJoinType().isEmpty())
                ? "INNER JOIN" : request.getJoinType();

        // Build JOIN query
        StringBuilder query = new StringBuilder("SELECT ");
        if (request.getSelectedColumns() != null && !request.getSelectedColumns().isEmpty()) {
            query.append(String.join(", ", request.getSelectedColumns()));
        } else {
            query.append("*");
        }
        query.append(" FROM ").append(tables.get(0));
        // For each additional table, add join clause with the specified join type and join condition.
        for (int i = 1; i < tables.size(); i++) {
            query.append(" ").append(joinType).append(" ").append(tables.get(i))
                 .append(" ON ").append(request.getJoinCondition());
        }

        // Execute the query and store rows in a list of maps.
        List<Map<String, Object>> rows = new ArrayList<>();
        try (Connection conn = getConnection(details);
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(query.toString())) {

            ResultSetMetaData meta = rs.getMetaData();
            int colCount = meta.getColumnCount();

            while (rs.next()) {
                Map<String, Object> row = new LinkedHashMap<>();
                for (int i = 1; i <= colCount; i++) {
                    row.put(meta.getColumnName(i), rs.getObject(i));
                }
                rows.add(row);
            }
        }
        return rows;
    }
    
    // Preview Uploaded CSV file ->
    public List<Map<String, String>> readPreview(MultipartFile file) throws IOException {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            List<Map<String, String>> preview = new ArrayList<>();
            String line;
            String[] headers = null;
            int count = 0;

            while ((line = reader.readLine()) != null && count <= 50) {
                String[] values = line.split(",");
                if (headers == null) {
                    headers = values;
                } else {
                    Map<String, String> row = new LinkedHashMap<>();
                    for (int i = 0; i < headers.length && i < values.length; i++) {
                        row.put(headers[i], values[i]);
                    }
                    preview.add(row);
                    count++;
                }
            }
            return preview;
        }
    }

    // Utility: Get ClickHouse connection
    private Connection getConnection(ConnectionDetails details) throws SQLException {
        String url = String.format("jdbc:clickhouse://%s:%d/%s?compress=0",
                details.getHost(),
                details.getPort(),
                details.getDatabase()
        );

        Properties props = new Properties();
        props.setProperty("user", details.getUser());
        props.setProperty("password", details.getJwtToken());

        ClickHouseDataSource dataSource = new ClickHouseDataSource(url, props);
        return dataSource.getConnection();
    }
}
