-- Create vertex user
CREATE USER vertex WITH PASSWORD 'your_vertex_password' SUPERUSER;

-- Create databases
CREATE DATABASE vertex_inventory OWNER vertex;
CREATE DATABASE vertex_agent OWNER vertex;

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE vertex_inventory TO vertex;
GRANT ALL PRIVILEGES ON DATABASE vertex_agent TO vertex;
