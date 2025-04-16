package com.example.backend.model;

import java.util.List;
import java.util.Map;

public class IngestionRequest {
    public String direction; // "clickhouse_to_file" or "file_to_clickhouse"
    public ConnectionDetails connection;
    public List<String> selectedColumns;
    public String filePath; // used when uploading file to ClickHouse
    public String delimiter;
}
