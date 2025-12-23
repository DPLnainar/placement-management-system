# ADR 001: Database Choice - MongoDB vs PostgreSQL

## Context
The Placement Management System requires handling structured data (Users, Colleges, Jobs) and semi-structured data (Student Profiles with variable nested arrays like projects, skills, history).
We needed to choose between a NoSQL document store (MongoDB) and a Relational SQL database (PostgreSQL).

## Comparison

### 1. MongoDB (Current Choice)
*   **Pros**:
    *   **Schema Flexibility**: Excellent for "Student Profile" which evolves (e.g., adding a new "Certifications" array doesn't break schema).
    *   **Development Speed**: JSON storage maps directly to JavaScript objects/Frontend state.
    *   **Horizontal Scaling**: Native sharding support for high-volume read scenarios.
*   **Cons**:
    *   **Relationships**: `JOINS` ($lookup) are computationally expensive.
    *   **Transactions**: Multi-document ACID transactions are heavier than in SQL.

### 2. PostgreSQL (Alternative)
*   **Pros**:
    *   **Data Integrity**: Native Foreign Keys enforce strict hierarchy (e.g., cannot create a Student without a valid College ID).
    *   **Complex Queries**: SQL allows very efficient reporting and aggregation across multiple tables.
    *   **Reliability**: Mature ACID compliance.
*   **Cons**:
    *   **Rigid Schema**: Migrations required for every field change.
    *   **Horizontal Scaling**: More complex to set up (read replicas ok, sharding hard).

### 3. Cloud Implementations (Managed Services)

If we were to move to the cloud, here are the leaders for each:

#### A. MongoDB (Cloud: MongoDB Atlas)
*   **Ease of Use**: Native to MERN stack.
*   **Features**: Auto-scaling, Search Indexes, Charts.
*   **Free Tier**: Generous (512MB).
*   **Impact**: **Zero code changes** needed. Just change `MONGODB_URI` in `.env`.

#### B. PostgreSQL (Cloud: Supabase / Neon / AWS RDS)
*   **Supabase**: "Firebase for SQL". incredible UI, auto-generated APIs, real-time subscriptions.
*   **Neon**: Serverless Postgres, scales to zero (cheaper).
*   **AWS RDS**: Industry standard, solid, but complex to set up.
*   **Impact**: **Complete Backend Rewrite** needed. We would need to replace Mongoose with Prisma/Sequelize and migrate data.

## Decision
We chose **MongoDB** for this iteration.

### Rationale
1.  **Iterative Development**: The "Student Profile" structure changed multiple times during development. MongoDB allowed this without running SQL migrations daily.
2.  **Performance Optimization**:
    *   We mitigated the "Relationship" weakness by using **Mongoose Populate** and **Compound Indexes** (`[collegeId, branch]`).
    *   We mitigated the "Read Speed" issue by adding **Redis Caching**.
3.  **Stack Synergy**: The MERN stack (Mongo-Express-React-Node) offers a unified JSON language across the stack, reducing context switching.

## Future Consideration
If the system scales to millions of complex relational queries (e.g., "Find average CGPA of students who applied to 5+ companies and got rejected in 2"), **PostgreSQL** would be the superior choice for a dedicated "Analytics Service", potentially syncing data from the main Mongo operational DB.
