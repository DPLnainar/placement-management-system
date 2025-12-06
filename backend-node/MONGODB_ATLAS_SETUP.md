# MongoDB Atlas Setup Guide

This guide will walk you through setting up MongoDB Atlas for your Placement Management System.

## Table of Contents
- [Why MongoDB Atlas?](#why-mongodb-atlas)
- [Step 1: Create MongoDB Atlas Account](#step-1-create-mongodb-atlas-account)
- [Step 2: Create a Cluster](#step-2-create-a-cluster)
- [Step 3: Create Database User](#step-3-create-database-user)
- [Step 4: Configure Network Access](#step-4-configure-network-access)
- [Step 5: Get Connection String](#step-5-get-connection-string)
- [Step 6: Update Environment Variables](#step-6-update-environment-variables)
- [Step 7: Test Connection](#step-7-test-connection)
- [Optional: Migrate Existing Data](#optional-migrate-existing-data)
- [Troubleshooting](#troubleshooting)
- [Security Best Practices](#security-best-practices)

---

## Why MongoDB Atlas?

MongoDB Atlas is a fully-managed cloud database service that offers:
- ✅ **Free Tier**: 512 MB storage (perfect for development)
- ✅ **Automatic Backups**: Built-in backup and recovery
- ✅ **High Availability**: Automatic failover and replication
- ✅ **Scalability**: Easy to scale as your application grows
- ✅ **Security**: Built-in encryption and authentication
- ✅ **Monitoring**: Real-time performance metrics and alerts

---

## Step 1: Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Sign up using:
   - Email address
   - Google account
   - GitHub account
3. Verify your email address
4. Complete the welcome questionnaire (optional)

---

## Step 2: Create a Cluster

1. **Choose Deployment Type**
   - Click **"Build a Database"**
   - Select **"Shared"** (Free tier - M0)

2. **Select Cloud Provider & Region**
   - **Provider**: AWS, Google Cloud, or Azure (choose based on your preference)
   - **Region**: Select the region closest to your users
     - For India: `Mumbai (ap-south-1)` or `Singapore (ap-southeast-1)`
   - Click **"Create"**

3. **Cluster Configuration**
   - **Cluster Name**: Keep default or rename (e.g., `placement-system-cluster`)
   - **MongoDB Version**: Use the latest stable version (7.0+)
   - Click **"Create Cluster"**

> [!NOTE]
> Cluster creation takes 3-5 minutes. You can proceed with the next steps while it's being created.

---

## Step 3: Create Database User

1. **Navigate to Database Access**
   - In the left sidebar, click **"Database Access"** under **Security**

2. **Add New Database User**
   - Click **"Add New Database User"**
   - **Authentication Method**: Password
   - **Username**: Choose a username (e.g., `placement-admin`)
   - **Password**: 
     - Click **"Autogenerate Secure Password"** (recommended)
     - **IMPORTANT**: Copy and save this password securely!
   - **Database User Privileges**: Select **"Read and write to any database"**
   - Click **"Add User"**

> [!CAUTION]
> Save your password immediately! You won't be able to view it again. If lost, you'll need to reset it.

---

## Step 4: Configure Network Access

1. **Navigate to Network Access**
   - In the left sidebar, click **"Network Access"** under **Security**

2. **Add IP Address**
   - Click **"Add IP Address"**
   
   **For Development:**
   - Click **"Allow Access from Anywhere"**
   - This adds `0.0.0.0/0` to the IP whitelist
   - Click **"Confirm"**

   **For Production:**
   - Click **"Add Current IP Address"** to add your server's IP
   - Or manually enter specific IP addresses
   - Click **"Confirm"**

> [!WARNING]
> Using `0.0.0.0/0` allows connections from any IP address. This is fine for development but **NOT recommended for production**. Always use specific IP addresses in production.

---

## Step 5: Get Connection String

1. **Navigate to Database**
   - In the left sidebar, click **"Database"** under **Deployment**

2. **Connect to Cluster**
   - Click **"Connect"** button on your cluster
   - Select **"Connect your application"**

3. **Copy Connection String**
   - **Driver**: Node.js
   - **Version**: 5.5 or later
   - Copy the connection string (it looks like this):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

4. **Customize Connection String**
   - Replace `<username>` with your database username
   - Replace `<password>` with your database password
   - Add database name after `.net/`: `/<database-name>`
   
   **Example:**
   ```
   mongodb+srv://placement-admin:MySecureP@ssw0rd@cluster0.xxxxx.mongodb.net/placement?retryWrites=true&w=majority
   ```

> [!IMPORTANT]
> If your password contains special characters (`@`, `:`, `/`, etc.), you must URL-encode them:
> - `@` → `%40`
> - `:` → `%3A`
> - `/` → `%2F`
> - `?` → `%3F`
> - `#` → `%23`

---

## Step 6: Update Environment Variables

1. **Locate `.env` File**
   - Navigate to: `backend-node/.env`

2. **Backup Current `.env`**
   ```powershell
   # Create a backup
   cp .env .env.backup
   ```

3. **Update `MONGODB_URI`**
   - Open `.env` file in your editor
   - Find the line with `MONGODB_URI`
   - Replace it with your Atlas connection string:

   **Before:**
   ```env
   MONGODB_URI=mongodb://localhost:27017/placement
   ```

   **After:**
   ```env
   MONGODB_URI=mongodb+srv://placement-admin:MySecureP%40ssw0rd@cluster0.xxxxx.mongodb.net/placement?retryWrites=true&w=majority
   ```

4. **Save the file**

> [!TIP]
> Keep your `.env.backup` file in case you need to revert to local MongoDB.

---

## Step 7: Test Connection

1. **Start the Backend Server**
   ```powershell
   # Navigate to backend directory
   cd backend-node

   # Start the server
   npm start
   # OR if using the batch file
   ..\start-backend.bat
   ```

2. **Verify Connection**
   - Look for these messages in the console:
   ```
   ✓ MongoDB Connected: cluster0-shard-00-00.xxxxx.mongodb.net
   ✓ Database Name: placement
   ```

3. **Test Basic Operations**
   - Try logging in to your application
   - Create a test user or college
   - Verify data appears in MongoDB Atlas:
     - Go to Atlas Dashboard → **Browse Collections**
     - You should see your database and collections

> [!NOTE]
> If you see connection errors, check the [Troubleshooting](#troubleshooting) section below.

---

## Optional: Migrate Existing Data

If you have existing data in your local MongoDB that you want to migrate to Atlas:

### Method 1: Using MongoDB Compass (GUI)

1. **Install MongoDB Compass**
   - Download from [MongoDB Compass](https://www.mongodb.com/products/compass)

2. **Connect to Local MongoDB**
   - Connection string: `mongodb://localhost:27017`
   - Select your `placement` database

3. **Export Collections**
   - For each collection, click **"Export Collection"**
   - Choose **JSON** or **CSV** format
   - Save the files

4. **Connect to Atlas**
   - Use your Atlas connection string
   - Select your database

5. **Import Collections**
   - For each collection, click **"Import Data"**
   - Select the exported files
   - Click **"Import"**

### Method 2: Using MongoDB Tools (CLI)

1. **Export from Local MongoDB**
   ```powershell
   # Export all data
   mongodump --uri="mongodb://localhost:27017/placement" --out="./backup"
   ```

2. **Import to Atlas**
   ```powershell
   # Import all data
   mongorestore --uri="mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/placement" ./backup/placement
   ```

> [!TIP]
> For large databases, consider using MongoDB's [Live Migration Service](https://www.mongodb.com/cloud/atlas/migrate) for zero-downtime migration.

---

## Troubleshooting

### Connection Timeout Errors

**Error:** `MongoServerSelectionError: connection timed out`

**Solutions:**
1. Check your IP whitelist in Network Access
2. Verify your internet connection
3. Check if your firewall is blocking MongoDB ports
4. Ensure cluster is fully deployed (check Atlas dashboard)

### Authentication Failed

**Error:** `MongoServerError: bad auth: Authentication failed`

**Solutions:**
1. Verify username and password are correct
2. Check for special characters in password (must be URL-encoded)
3. Ensure database user has proper permissions
4. Try resetting the database user password

### Database Not Found

**Error:** Database appears empty or collections not found

**Solutions:**
1. Verify database name in connection string
2. Check if you're connected to the correct cluster
3. Ensure data was properly migrated (if applicable)

### DNS Resolution Issues

**Error:** `MongoServerSelectionError: getaddrinfo ENOTFOUND`

**Solutions:**
1. Check your internet connection
2. Verify the cluster URL is correct
3. Try using a different DNS server
4. Check if your network blocks MongoDB Atlas domains

### Connection String Issues

**Common Mistakes:**
- ❌ Forgot to replace `<username>` and `<password>`
- ❌ Special characters in password not URL-encoded
- ❌ Missing database name in connection string
- ❌ Using `mongodb://` instead of `mongodb+srv://`

---

## Security Best Practices

### 1. Environment Variables
- ✅ **Never commit `.env` files** to version control
- ✅ Add `.env` to `.gitignore`
- ✅ Use different credentials for development and production

### 2. Database Users
- ✅ Create separate users for different environments
- ✅ Use strong, auto-generated passwords
- ✅ Grant minimum required privileges
- ✅ Rotate passwords regularly

### 3. Network Access
- ✅ Use specific IP addresses in production
- ✅ Regularly review and update IP whitelist
- ✅ Use VPN for remote access
- ✅ Enable audit logs for security monitoring

### 4. Connection Strings
- ✅ Store in environment variables, not in code
- ✅ Use secrets management tools (AWS Secrets Manager, Azure Key Vault)
- ✅ Enable connection string encryption
- ✅ Monitor for exposed credentials using tools like GitGuardian

### 5. Monitoring & Alerts
- ✅ Enable Atlas monitoring and alerts
- ✅ Set up alerts for:
  - High connection counts
  - Failed authentication attempts
  - Unusual query patterns
  - Storage usage thresholds

### 6. Backups
- ✅ Enable automated backups (available in paid tiers)
- ✅ Test backup restoration regularly
- ✅ Keep backups in multiple regions
- ✅ Document backup and recovery procedures

---

## Additional Resources

- [MongoDB Atlas Documentation](https://www.mongodb.com/docs/atlas/)
- [Connection String Format](https://www.mongodb.com/docs/manual/reference/connection-string/)
- [Security Checklist](https://www.mongodb.com/docs/manual/administration/security-checklist/)
- [MongoDB University](https://university.mongodb.com/) - Free courses
- [Atlas Support](https://www.mongodb.com/cloud/atlas/support)

---

## Need Help?

If you encounter any issues:
1. Check the [Troubleshooting](#troubleshooting) section above
2. Review [MongoDB Atlas Documentation](https://www.mongodb.com/docs/atlas/)
3. Visit [MongoDB Community Forums](https://www.mongodb.com/community/forums/)
4. Contact [MongoDB Support](https://support.mongodb.com/)

---

**🎉 Congratulations!** You've successfully set up MongoDB Atlas for your Placement Management System!
