<!-- ClickHouse & Flat File Data Ingestion Tool

Overview
This project is a web-based application that facilitates bidirectional data ingestion between a ClickHouse database and a flat file (CSV). It includes two main flows:

ClickHouse to Flat File: Exporting data from a ClickHouse table to a CSV file.

Flat File to ClickHouse: Uploading a CSV file and inserting its data into a ClickHouse table.

A bonus feature is included for performing multi-table joins. In this mode, the user can select two tables, specify join columns and the join type (e.g., inner, left, right, full), and view the resulting joined data.

Features
ClickHouse Connection:

Configure connection settings (host, port, database, user, JWT token) in the UI.

Test the connection via the /api/connect-clickhouse endpoint.

Data Ingestion:

Export Flow:

Select table columns, execute a query, and export the result as a CSV file.

Import Flow:

Upload a CSV file (the backend automatically extracts the header row to determine columns) and insert data into a ClickHouse table.

Multi-Table Join (Bonus):

UI allows selection of two tables, selection of columns from each table as join keys, choosing the join type (inner, left, right, full), and optionally specifying result columns.

The backend constructs and executes the JOIN query and returns the joined data, which is then displayed in the UI.

Preview: Optional endpoints allow data preview before ingestion.

Technology Stack
Frontend: React with Vite

Components include:

ConnectClickHouse.jsx for connection configuration.

DataTable.jsx for displaying table in the UI.

ColumnsCheckbox.jsx for column selection.

Ingest.jsx for triggering ingestion.

JoinTables.jsx for configuring and performing multi-table joins.

ListTables.jsx for displaying all the available tables

ProgressBar.jsx for progress bar display.

Backend: Java with Spring Boot

Uses the official clickhouse-java client for ClickHouse connectivity.

Provides REST endpoints for connection testing, fetching tables and columns, ingesting data, and performing joins.

Other Tools:

Maven for building the Java application.

Axios on the frontend for making API calls.

Thunder Client for API testing.

Project Structure
bash
Copy
Edit
clickhouse-ingestion-tool/
├── backend/             # Spring Boot project
│   ├── src/main/java/com/example/backend/
│   │   ├── config/     # CORS and other configuration
│   │   ├── controller/ # IngestionController.java
│   │   ├── model/      # ConnectionDetails.java, IngestionRequest.java, JoinRequest.java, etc.
│   │   └── service/    # ClickHouseService.java
│   └── pom.xml
└── frontend/            # React project with Vite
    ├── src/
    │   ├── components/
    │   │   ├── ColumnsCheckbox.jsx
    │   │   ├── ConnectClickHouse.jsx
    │   │   ├── DataTable.jsx
    │   │   ├── Ingest.jsx
    │   │   ├── JoinTables.jsx
    │   │   ├── ListTables.jsx
    │   │   └── ProgressBar.jsx
    │   ├── styles/
    │   ├── App.jsx
    │   └── main.jsx
    ├── package.json
    └── vite.config.js

Setup & Running Instructions
Backend (Spring Boot)
Clone the repository:

bash
Copy
Edit
git clone <REPO_URL>
cd clickhouse-ingestion-tool/backend
Configure Environment:

Ensure you have Maven and Java installed.

Update any connection details in application.properties as needed.

Build & Run:

bash
Copy
Edit
mvn clean package
mvn spring-boot:run
CORS Configuration: The backend is configured (via WebConfig.java) to accept requests from your Vite frontend (e.g., http://localhost:5173).

Frontend (React with Vite)
Clone the repository (if not already done) and navigate to the frontend directory:

bash
Copy
Edit
cd clickhouse-ingestion-tool/frontend
Install dependencies:

bash
Copy
Edit
npm install
Configure Environment Variables:

Create a .env file (if needed) with:

ini
Copy
Edit
VITE_API_URL=http://localhost:8081 (Change the server.port setting inside application.properties in the backend)
Run the development server:

bash
Copy
Edit
npm run dev
Access the Frontend: Open your browser at http://localhost:5173.

API Endpoints
POST /api/connect-clickhouse

Tests connectivity to ClickHouse.

POST /api/list-tables

Returns the list of tables for the specified database.

POST /api/fetch-columns

Returns column names for a given table.

POST /api/ingest

Performs data ingestion (export ClickHouse to file or import file to ClickHouse).

POST /api/join

Executes a join operation across two tables and returns joined data.

Bonus: Multi-Table Join Feature
Frontend:

Use the JoinTables.jsx component to select multiple tables.

Choose join columns (with dropdowns populated by available columns for each table).

Choose the join type via radio buttons.

Specify optional result columns.

View the joined results in an HTML table.

Backend:

The JoinRequest model now includes a joinType field.

The ClickHouseService builds and executes a dynamic join query, and returns the result data.

The IngestionController exposes the /api/join endpoint.

Testing
Use Thunder Client or Postman to test the endpoints:

For connection testing and ingestion flows, send a JSON payload with your connection details.

For the join query, ensure you pass valid table names, join type, and optionally columns.

Verify the CSV file is generated correctly and that joined data is displayed on the UI.

AI Tooling & Prompts
If you want to checkout the prompts given while using AI coding assistance, refer to prompts.txt file in the root folder.

Conclusion
This project demonstrates the integration of a modern web stack (React, Spring Boot) to solve a real-world data ingestion and transformation challenge. The solution is modular, scalable, and includes bonus features like multi-table joins for added functionality. -->

# ClickHouse & Flat File Data Ingestion Tool

## Overview

This project is a web-based application that facilitates bidirectional data ingestion between a ClickHouse database and a flat file (CSV). It includes two primary flows:

- **ClickHouse to Flat File:** Export data from a ClickHouse table to a CSV file.
- **Flat File to ClickHouse:** Upload a CSV file and insert its data into a ClickHouse table.

A bonus feature allows for multi-table joins. In this mode, the user can:
- Select two or more tables.
- Specify join columns.
- Choose the join type (e.g., INNER JOIN, LEFT JOIN, RIGHT JOIN, FULL JOIN).
- Optionally specify result columns for the joined data preview.

## Features

### ClickHouse Connection
- **Configuration:** Set connection settings (host, port, database, user, JWT token) in the UI.
- **Testing:** Test the connection via the `/api/connect-clickhouse` endpoint.

### Data Ingestion

#### Export Flow (ClickHouse to Flat File)
- Select table columns.
- Execute a query.
- Export the resulting data as a CSV file.

#### Import Flow (Flat File to ClickHouse)
- **CSV Upload:** Upload a CSV file, where the backend automatically extracts the header row to determine columns.
- **Data Insertion:** Insert the CSV data into a specified ClickHouse table.
- **Preview Feature:** Preview the first 50 records of the CSV file before ingestion.

### Multi-Table Join (Bonus)
- **Table Selection:** UI to select two or more tables.
- **Join Configuration:** Choose join keys from each table and select join type.
- **Result Preview:** The backend constructs and executes the join query, returning the joined data for preview in the UI.

## Technology Stack

### Frontend
- **Framework:** React (with Vite)
- **Key Components:**
  - **ConnectClickHouse.jsx:** For configuring connection settings.
  - **DataTable.jsx:** For displaying data tables.
  - **ColumnsCheckbox.jsx:** For selecting columns.
  - **Ingest.jsx:** For initiating data ingestion.
  - **JoinTables.jsx:** For setting up and executing multi-table joins.
  - **ListTables.jsx:** For displaying all available tables.
  - **ProgressBar.jsx:** For showing progress during lengthy operations.
- **HTTP Library:** Axios (for API calls)  
- **Routing:** React Router

### Backend
- **Framework:** Spring Boot (Java)
- **Database Client:** Official clickhouse-java client for ClickHouse connectivity.
- **REST Endpoints:**
  - `/api/connect-clickhouse`: Tests the connection to ClickHouse.
  - `/api/fetch-columns`: Retrieves columns for a selected table.
  - `/api/ingest`: Handles data ingestion from CSV to ClickHouse.
  - `/api/ingest-file`: Handles file-based CSV uploads.
  - `/api/join`: Executes multi-table join queries.
  - `/api/preview-csv`: Provides a preview (first 50 records) of an uploaded CSV file.
- **Build Tool:** Maven

### Other Tools
- **Thunder Client:** For API testing and debugging.

## Project Structure

```bash
clickhouse-ingestion-tool/
├── backend/            # Spring Boot project
│   ├── src/main/java/com/example/backend/
│   │   ├── config/     # CORS and other configuration
│   │   ├── controller/ # IngestionController.java
│   │   ├── model/      # ConnectionDetails.java, IngestionRequest.java, JoinRequest.java, etc.
│   │   └── service/    # ClickHouseService.java
│   └── pom.xml
└── frontend/            # React project with Vite
    ├── src/
    │   ├── components/
    │   │   ├── ColumnsCheckbox.jsx
    │   │   ├── ConnectClickHouse.jsx
    │   │   ├── DataTable.jsx
    │   │   ├── Ingest.jsx
    │   │   ├── JoinTables.jsx
    │   │   ├── ListTables.jsx
    │   │   └── ProgressBar.jsx
    │   ├── styles/
    │   ├── App.jsx
    │   └── main.jsx
    ├── package.json
    └── vite.config.js
```

## Setup & Running Instructions

### Backend (Spring Boot)
1. **Clone the repository:**  
   - Run: `git clone <REPO_URL>`  
   - Then navigate to the backend folder: `cd clickhouse-ingestion-tool/backend`

2. **Configure Environment:**  
   - Ensure you have Maven and Java installed on your machine.
   - Update any connection details in `application.properties` as needed.

3. **Build & Run:**  
   - Build the project by running: `mvn clean package`  
   - Start the backend server using: `mvn spring-boot:run`

4. **CORS Configuration:**  
   - The backend is already configured (via `WebConfig.java`) to accept requests from your Vite frontend (for example, from `http://localhost:5173`).

### Frontend (React with Vite)
1. **Navigate to the Frontend Directory:**  
   - From the root of the repository, move to the frontend folder: `cd clickhouse-ingestion-tool/frontend`

2. **Install Dependencies:**  
   - Install all necessary packages by running: `npm install`

3. **Configure Environment Variables:**  
   - Create a `.env` file (if not already present) in the frontend directory.
   - Add the following line to the `.env` file:  
     `VITE_API_URL=http://localhost:8081`  
   - Note: Ensure the API URL corresponds to the correct server port defined in your backend `application.properties`.

4. **Run the Development Server:**  
   - Start the frontend application with: `npm run dev`

5. **Access the Application:**  
   - Open your browser and go to: `http://localhost:5173`

# API Endpoints

### POST /api/connect-clickhouse
Tests connectivity to ClickHouse.

### POST /api/list-tables
Returns the list of tables for the specified database.

### POST /api/fetch-columns
Returns column names for a given table.

### POST /api/ingest
Performs data ingestion (export ClickHouse to file or import file to ClickHouse).

### POST /api/join
Executes a join operation across two tables and returns joined data.

## Bonus: Multi-Table Join Feature

### Frontend
- Use the `JoinTables.jsx` component to select multiple tables.
- Choose join columns (with dropdowns populated by available columns for each table).
- Choose the join type via radio buttons.
- Specify optional result columns.
- View the joined results in an HTML table.

### Backend
- The `JoinRequest` model now includes a `joinType` field.
- The `ClickHouseService` builds and executes a dynamic join query, and returns the result data.
- The `IngestionController` exposes the `/api/join` endpoint.

## Testing
- Use Thunder Client or Postman to test the endpoints:
  - For connection testing and ingestion flows, send a JSON payload with your connection details.
  - For the join query, ensure you pass valid table names, join type, and optionally columns.
  - Verify the CSV file is generated correctly and that joined data is displayed on the UI.

## AI Tooling & Prompts
- For more insight into the AI-driven development process, check out the `prompts.txt` file located in the project's root directory.

## Conclusion
This project demonstrates the integration of a modern web stack (React, Spring Boot) to solve a real-world data ingestion and transformation challenge. The solution is modular, scalable, and includes bonus features like multi-table joins for added functionality.
