# 44,000 Riders, Zero Trains: A Case for the Geary Subway
### Personal Project

**A data-driven analysis proving why the Geary corridor is the most underserved transit route in San Francisco.**

This project uses interactive geospatial mapping and statistical visualization to argue that the Geary bus corridor, serving over 44,000 daily riders, has outgrown its current infrastructure and requires a high-capacity subway line.

🔗 **[View the Live Project Here](https://musubi3.github.io/sfmta-geary-subway/)**

---

## 📊 Project Overview

The analysis is structured into four key data stories:

1.  **The Map (Geospatial Analysis):** <br>
An interactive choropleth map showing population density and vehicle ownership (equity). It contrasts the "rail desert" of the Geary corridor against the rail-rich Mission/Market corridor.

2.  **Ridership (Comparative Analysis):** <br>
A stacked bar chart proving the Geary corridor is the #1 busiest bus-only corridor in SF, rivaling the total ridership of the Mission super-corridor.

3.  **Trends (Time-Series Analysis):** <br>
A line chart tracking post-pandemic recovery, proving that Geary's demand is structural and resilient.

4.  **Crowding (Efficiency Analysis):** <br>
A bar chart ranking routes by peak-hour crowding, identifying the 38R as a system failure point.

## 🛠️ Tech Stack

### Frontend & Visualization
* **D3.js (v7):**<br>Used for all data visualizations, including the interactive map, SVG generation, scales, and axes.

* **HTML5/CSS3:**<br>Semantic HTML structure with a responsive, dark-mode compatible design using CSS variables and Flexbox.

* **JavaScript (ES6):**<br>Modular architecture (`type="module"`) separating chart logic into distinct files.

### Data Engineering & Processing
* **Python:**<br>Used for ETL (Extract, Transform, Load) processes.

* **Pandas:**<br>Used for cleaning ridership CSVs, aggregating route data into corridors, and handling time-series calculations.

* **GeoPandas:**<br>Used for merging census demographic data with geometric shapefiles and calculating population density per square mile.

* **Jupyter Notebooks:**<br>Used for exploratory data analysis (EDA).

## 📂 Data Sources

This project aggregates data from multiple public sources:

| Dataset | Source | Description |
| :--- | :--- | :--- |
| **Density + Equity** | [Census Reporter](https://censusreporter.org/profiles/14000US06075012502-census-tract-12502-san-francisco-ca) |Population Density (Table `B01003`) and Vehicle Availability (Table `B08201`). |
| **Ridership + Crowding** | [SFMTA](https://www.sfmta.com/muni-data) | Monthly Average Daily Boardings and AM/PM Peak Crowding metrics (2019-2025). |
| **BART Routes** | [BART](https://www.bart.gov/schedules/developers/geo) | GeoJSON coordinates for all BART stations (used to generate route lines). |
| **Muni Routes** | [DataSF](https://data.sfgov.org/Transportation/Map-of-Muni-Simple-Routes/ubh8-p5ug) | Shapefiles for all SFMTA bus and light rail lines. |
| **Base Map Layers** | [DataSF](https://data.sfgov.org/) | SF County boundaries, land mass, and water bodies for map masking. |