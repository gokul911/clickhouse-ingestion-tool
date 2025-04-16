package com.example.backend.controller;

import com.example.backend.model.ConnectionDetails;
import com.example.backend.model.IngestionRequest;
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

@RestController
@RequestMapping("/api")
public class IngestionController {

    private final ClickHouseService clickHouseService = new ClickHouseService();

    // 1. Connect to ClickHouse
    @PostMapping("/connect-clickhouse")
    public ResponseEntity<String> connect(@RequestBody ConnectionDetails details) {
        boolean connected = clickHouseService.testConnection(details);
        return connected ? ResponseEntity.ok("Connection successful!") :
                ResponseEntity.status(500).body("FAILED CONNECT");
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

    // 4. Ingest data based on selected direction and columns
    @PostMapping("/ingest")
    public ResponseEntity<Map<String, Object>> ingest(@RequestBody IngestionRequest request) {
        try {
            int count = clickHouseService.performIngestion(request);
            return ResponseEntity.ok(Map.of("count", count));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // This API allows multipart form data instead of json data
    @PostMapping("/ingest-file")
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

    // (Optional) 5. Preview first 100 records from ClickHouse
    @PostMapping("/preview-table")
    public ResponseEntity<List<Map<String, Object>>> preview(@RequestBody ConnectionDetails details) {
        try {
            List<Map<String, Object>> previewData = clickHouseService.previewData(details);
            return ResponseEntity.ok(previewData);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(null);
        }
    }

    // (Bonus) 6. Join Table and export as csv
    @PostMapping("/join")
    public ResponseEntity<?> joinTables(@RequestBody JoinRequest request) {
        try {
            List<Map<String, Object>> result = clickHouseService.executeJoin(request);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
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

}
