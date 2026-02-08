# text2sql

A natural language to SQL query application that allows users to upload CSV files and ask questions about the data using plain English.

## Project Structure

```
text2sql/
├── public/
│   ├── sql-wasm.wasm     # SQL.js WebAssembly file
│   └── vite.svg          # Vite logo
├── src/
│   ├── App.jsx           # Main application component
│   ├── main.jsx          # Entry point
│   ├── index.css         # Styles
│   └── assets/
│       └── react.svg     # React logo
├── .gitignore            # Git ignore file
├── eslint.config.js      # ESLint configuration
├── index.html            # HTML entry point
├── package.json          # Dependencies and scripts
├── postcss.config.js     # PostCSS configuration
├── tailwind.config.js    # Tailwind CSS configuration
└── vite.config.js        # Vite configuration
```

## Workflow

1. **Data Upload**: Users upload CSV files via drag-and-drop or file selection
2. **Data Processing**: The application parses CSV data and loads it into an in-browser SQLite database using SQL.js
3. **Natural Language Query**: Users ask questions about the data in plain English
4. **SQL Generation**: The application sends the question and database schema to an LLM (Large Language Model) to generate SQL
5. **Query Execution**: The generated SQL is executed against the in-browser database
6. **Results Display**: Query results are displayed in a formatted table

## Key Features

- **CSV Data Import**: Drag and drop CSV files to upload datasets
- **Natural Language Processing**: Ask questions in plain English
- **In-Browser Database**: Uses SQL.js to create an in-browser SQLite database
- **Real-time Query Results**: Instant execution and display of query results
- **SQL Query Display**: Option to show the generated SQL queries
- **Responsive UI**: Clean, modern interface with Tailwind CSS styling
- **Configurable LLM Settings**: Customize model, port, and API key

## Technologies Used

- **Frontend**: React, Vite, Tailwind CSS
- **Database**: SQL.js (SQLite in browser)
- **UI Components**: Framer Motion, Lucide React icons
- **Data Processing**: PapaParse for CSV parsing
- **HTTP Client**: Axios for API requests
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with custom dark theme

## Setup Instructions

1. **Prerequisites**:
   - Node.js (v18 or higher)
   - npm or pnpm

2. **Installation**:
   ```bash
   npm install
   ```

3. **Development Server**:
   ```bash
   npm run dev
   ```

4. **Build for Production**:
   ```bash
   npm run build
   ```

5. **Preview Production Build**:
   ```bash
   npm run preview
   ```

## Configuration

The application requires a running LLM server to generate SQL queries. By default, it expects the server to be running on `localhost:11434` (ollama) or `localhost:1234` (lmstudio or `ggc e4`).

### Settings

- **Model**: Name of the LLM model to use
- **Port**: Port number where the LLM server is running
- **API Key**: API key for the LLM service (if required)
- **Show SQL**: Toggle to display generated SQL queries

## Usage

1. Start the development server: `npm run dev`
2. Open your browser and navigate to `http://localhost:5173`
3. Upload a CSV file using the drag-and-drop area
4. Ask questions about your data in natural language
5. View results in the chat interface

## Dependencies

- react: ^19.2.0
- react-dom: ^19.2.0
- sql.js: ^1.13.0
- axios: ^1.13.4
- papaparse: ^5.5.3
- framer-motion: ^12.33.0
- lucide-react: ^0.563.0
- tailwind-merge: ^3.4.0
- clsx: ^2.1.1
- react-dropzone: ^14.4.0

## Development

This project uses Vite for development and build processes. The application is built with React and styled using Tailwind CSS.

## License

This project is licensed under the MIT License.