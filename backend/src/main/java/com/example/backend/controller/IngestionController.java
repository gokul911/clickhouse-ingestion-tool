package com.example.backend.controller;

import com.example.backend.model.ConnectionDetails;
import com.example.backend.model.ExportRequest;
import com.example.backend.model.JoinRequest;
import com.example.backend.service.ClickHouseService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;

import java.util.List;
import java.util.Map;

import jakarta.servlet.http.HttpServletResponse;

@RestController
@RequestMapping("/api")
public class IngestionController {

    private final ClickHouseService clickHouseService = new ClickHouseService();

    // 1. Connect to ClickHouse
    @PostMapping("/connect-clickhouse")
    public ResponseEntity<String> connect(@RequestBody ConnectionDetails details) {
        boolean connected = clickHouseService.testConnection(details);
        return connected ? ResponseEntity.ok("Connection successful!") :
                ResponseEntity.status(500).body("FAILED TO CONNECT");
    }

    // 2. Fetch list of tables from ClickHouse
    @PostMapping("/list-tables")
    public ResponseEntity<List<String>> listTables(@RequestBody ConnectionDetails details) {
        try {
            List<String> tables = clickHouseService.fetchTables(details);
            return ResponseEntity.ok(tables);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(null);
        }
    }

    // 3. Fetch columns of selected table
    @PostMapping("/fetch-columns")
    public ResponseEntity<List<String>> fetchColumns(@RequestBody ConnectionDetails details) {
        try {
            List<String> columns = clickHouseService.fetchColumns(details);
            return ResponseEntity.ok(columns);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(null);
        }
    }

    // 4. Allow multipart form data instead of json data to be ingested into clickhouse table
    @PostMapping("/import-file")
    public ResponseEntity<?> ingestFileToClickHouse(
            @RequestPart("file") MultipartFile file,
            @RequestPart("connection") String connectionJson
    ) {
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            ConnectionDetails connectionDetails = objectMapper.readValue(connectionJson, ConnectionDetails.class);

            int inserted = clickHouseService.importCsvFileToClickHouse(file.getInputStream(), connectionDetails);

            return ResponseEntity.ok(Map.of("count", inserted));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // 5. Converts clickhouse table into csv file and lets the user download it
    @PostMapping("/export-file")
    public void exportClickHouseToCsv(
            @RequestBody ExportRequest exportRequest,
            HttpServletResponse response
    ) {
        response.setContentType("text/csv");
        response.setHeader("Content-Disposition", "attachment; filename=\"" + exportRequest.getTable() + ".csv\"");

        try {
            clickHouseService.streamClickHouseTableToCsv(
                exportRequest.getConnectionDetails(),
                exportRequest.getTable(),
                exportRequest.getSelectedColumns(),
                exportRequest.getDelimiter(),
                response.getWriter()
            );
        } catch (Exception e) {
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }

    // (Optional) 6. Preview first 100 records from ClickHouse or Uploaded CSV
    @PostMapping("/preview-table")
    public ResponseEntity<List<Map<String, Object>>> preview(@RequestBody ConnectionDetails details) {
        try {
            List<Map<String, Object>> previewData = clickHouseService.previewData(details);
            return ResponseEntity.ok(previewData);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(null);
        }
    }
    @PostMapping("/preview-csv")
    public ResponseEntity<?> previewCSV(@RequestParam("file") MultipartFile file) {
        try {
            return ResponseEntity.ok(clickHouseService.readPreview(file));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to read CSV: " + e.getMessage()));
        }
    }

    // (Bonus) 7. Join Table and export as csv
    @PostMapping("/join")
    public ResponseEntity<?> joinTables(@RequestBody JoinRequest request) {
        try {
            List<Map<String, Object>> result = clickHouseService.executeJoin(request);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }


}
