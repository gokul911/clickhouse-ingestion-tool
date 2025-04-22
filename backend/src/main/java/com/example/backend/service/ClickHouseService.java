package com.example.backend.service;

import com.clickhouse.jdbc.ClickHouseDataSource;
import com.example.backend.model.ConnectionDetails;
import com.example.backend.model.JoinRequest;

import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.sql.*;
import java.util.*;
import java.util.stream.Collectors;

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

    // 4. Import CSV file to ClickHouse table (auto-detect columns from header)
    public int importCsvFileToClickHouse(InputStream csvStream, ConnectionDetails details) throws Exception {
        int inserted = 0;

        try (Connection conn = getConnection(details);
            Statement stmt = conn.createStatement();
            Reader reader = new InputStreamReader(csvStream);
            CSVParser csvParser = CSVFormat.DEFAULT
                    .withFirstRecordAsHeader()
                    .withTrim()
                    .parse(reader)) {

            List<String> headers = csvParser.getHeaderNames();

            String insertQueryPrefix = "INSERT INTO " + details.getTable() + " (" +
                    headers.stream().map(col -> "`" + col + "`").collect(Collectors.joining(", ")) + ") VALUES ";

            for (CSVRecord record : csvParser) {
                if (record.size() != headers.size()) {
                    System.out.println("Skipping row: column/value mismatch: " + record.toString());
                    continue;
                }

                // Build the value row for insert
                StringBuilder valueRow = new StringBuilder("(");
                for (int i = 0; i < headers.size(); i++) {
                    String val = record.get(i).replace("'", "''");
                    valueRow.append("'").append(val).append("'");
                    if (i < headers.size() - 1) valueRow.append(",");
                }
                valueRow.append(")");

                // Build WHERE condition using all columns
                StringBuilder whereConditions = new StringBuilder();
                for (int i = 0; i < headers.size(); i++) {
                    if (i > 0) whereConditions.append(" AND ");
                    whereConditions.append("`")
                            .append(headers.get(i))
                            .append("` = '")
                            .append(record.get(i).replace("'", "''"))
                            .append("'");
                }

                String checkQuery = "SELECT 1 FROM " + details.getTable() +
                                    " WHERE " + whereConditions + " LIMIT 1";

                ResultSet rs = stmt.executeQuery(checkQuery);
                if (!rs.next()) {
                    stmt.execute(insertQueryPrefix + valueRow);
                    inserted++;
                    System.out.println("Row " + inserted + " inserted");
                } else {
                    System.out.println("Duplicate row skipped: " + record.toString());
                }
                rs.close();
            }
        }

        return inserted;
    }

    // 5. Export Clickhouse table to CSV file
    public void streamClickHouseTableToCsv(
        ConnectionDetails details,
        String table,
        List<String> selectedColumns,
        String delimiter,
        PrintWriter writer
    ) throws SQLException {

        String columnList = String.join(", ", selectedColumns);
        String query = "SELECT " + columnList + " FROM " + table;
        String actualDelimiter = (delimiter != null) ? delimiter : ",";

        try (
            Connection conn = getConnection(details);
            Statement stmt = conn.createStatement();
            ResultSet rs = stmt.executeQuery(query)
        ) {
            ResultSetMetaData meta = rs.getMetaData();

            // Write header
            for (int i = 1; i <= meta.getColumnCount(); i++) {
                writer.print(meta.getColumnName(i));
                if (i < meta.getColumnCount()) writer.print(actualDelimiter);
            }
            writer.println();

            // Write rows
            while (rs.next()) {
                for (int i = 1; i <= meta.getColumnCount(); i++) {
                    writer.print(rs.getString(i));
                    if (i < meta.getColumnCount()) writer.print(actualDelimiter);
                }
                writer.println();
            }

        } catch (SQLException e) {
            e.printStackTrace();
            throw e;
        }
    }

    // 6. Preview first 100 rows ( using LIMIT )
    public List<Map<String, Object>> previewData(ConnectionDetails details) throws SQLException {
        List<Map<String, Object>> preview = new ArrayList<>();
        String query = "SELECT * FROM " + details.getTable() + " LIMIT 100";

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

    // 7. Preview Uploaded CSV file ->
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

    // 8. Constructs and executes the JOIN query based on the JoinRequest and returns the joined rows.
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

    // Utility: Get ClickHouse connection
    private Connection getConnection(ConnectionDetails details) throws SQLException {
        String url = String.format("jdbc:clickhouse://%s:%d/%s?secure=true&compress=0",
                details.getHost(),
                details.getPort(),
                details.getDatabase()
        );

        // 
        System.out.println("Connecting to URL: " + url);

        Properties props = new Properties();
        props.setProperty("user", details.getUser());
        props.setProperty("password", details.getJwtToken());

        ClickHouseDataSource dataSource = new ClickHouseDataSource(url, props);
        return dataSource.getConnection();
    }
}
