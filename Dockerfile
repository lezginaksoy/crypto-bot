# Use an official Node.js runtime as a parent image
FROM node:20

# Set the working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Expose port (if needed for future enhancements like a web interface)
EXPOSE 3000

# Command to run the bot
CMD ["node", "src/botservice.js"]
