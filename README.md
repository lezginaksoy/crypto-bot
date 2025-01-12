# Uphold Bot

## Description
This bot connects to the Uphold public ticker API and retrieves the BTC-USD rate at regular intervals. 
It is logging an alert when the price changes by 0.01% or more.

## Requirements
- Node.js >= v20
- npm

## Setup Instructions
1. Clone the repository.
2. Run `npm install` to install the necessary dependencies.
3. Run the bot using the following command:

## Run
- node src/botservice.js

## tests
- npx jest

## If you don’t have PostgreSQL installed, you can use Docker 
- docker run --name uphold-bot -e POSTGRES_PASSWORD=postgres -d postgres


## build and start the services using docker-compose:
- docker-compose up --build
  This command will:
   Build the bot service using the Dockerfile.
   Pull the official PostgreSQL image.
   Start both services and set up the PostgreSQL database.

- docker-compose up -d
   to run the containers in detached mode 

## other usefull docker-compose commands
- docker ps
   Verify that the bot and PostgreSQL are running
- docker-compose down
   To stop the containers:
- docker-compose down --volumes
   To remove the containers, networks, and volumes


## Connect to the PostgreSQL instance and create a table to store alerts
CREATE TABLE alerts (
  id SERIAL PRIMARY KEY,
  pair VARCHAR(10),
  change_percent NUMERIC,
  rate NUMERIC,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);