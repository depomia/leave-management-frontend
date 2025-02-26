# Use an official Bun image as a base
FROM oven/bun:1

# Set the working directory
WORKDIR /app

# Copy package.json and bun.lockb
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install

# Copy the rest of the application code
COPY . .

# Build the TypeScript code
# RUN bun run tsc

# Expose the application port
EXPOSE 3000

# Command to run the application
CMD ["bun", "run", "start"]
