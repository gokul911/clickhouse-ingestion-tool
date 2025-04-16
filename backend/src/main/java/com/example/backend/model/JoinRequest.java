package com.example.backend.model;

import java.util.List;

public class JoinRequest {
    private ConnectionDetails connection;
    private List<String> tables;             // Tables to join (in this case, exactly 2)
    private String joinCondition;            // The JOIN condition (e.g., "table1.col = table2.col")
    private List<String> selectedColumns;    // Columns to select in final query
    private String joinType;                 // e.g., "INNER JOIN", "LEFT JOIN", etc.

    // Getters and setters
    
    public ConnectionDetails getConnection() {
        return connection;
    }

    public void setConnection(ConnectionDetails connection) {
        this.connection = connection;
    }

    public List<String> getTables() {
        return tables;
    }

    public void setTables(List<String> tables) {
        this.tables = tables;
    }

    public String getJoinCondition() {
        return joinCondition;
    }

    public void setJoinCondition(String joinCondition) {
        this.joinCondition = joinCondition;
    }

    public List<String> getSelectedColumns() {
        return selectedColumns;
    }

    public void setSelectedColumns(List<String> selectedColumns) {
        this.selectedColumns = selectedColumns;
    }
    
    public String getJoinType() {
        return joinType;
    }
    
    public void setJoinType(String joinType) {
        this.joinType = joinType;
    }
}
