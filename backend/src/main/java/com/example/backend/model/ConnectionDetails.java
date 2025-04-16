package com.example.backend.model;

public class ConnectionDetails {
    private String host;
    private int port;
    private String database;
    private String user;
    private String jwtToken;
    private String table;

    public String getHost() { return host; }
    public void setHost(String host) { this.host = host; }

    public int getPort() { return port; }
    public void setPort(int port) { this.port = port; }

    public String getDatabase() { return database; }
    public void setDatabase(String database) { this.database = database; }

    public String getUser() { return user; }
    public void setUser(String user) { this.user = user; }

    public String getJwtToken() { return jwtToken; }
    public void setJwtToken(String jwtToken) { this.jwtToken = jwtToken; }

    public String getTable() { return table; }
    public void setTable(String table) { this.table = table; }
}
