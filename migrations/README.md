# Migrations

This directory contains all SQL migration files for database schema changes and data migrations.

## Directory Contents

SQL files for:
- Schema modifications
- New table/column additions
- Data migrations
- Index creation
- Constraint updates
- Field type changes

## Migration Files

### Schema Migrations
- `add-*.sql` - Add new columns, tables, or features
- `migrate-*.sql` - Transform existing data or schema
- `apply-*.sql` - Apply specific fixes or updates

### Common Migrations in This Directory

- `add-exercise-image-fields.sql` - Adds image support for exercises
- `add-name-column.sql` - Adds name fields to tables
- `add-regional-bias-migration.sql` - Regional exercise preferences
- `migrate-to-exercise-type.sql` - Exercise type field migration
- `migration-exercise-type.sql` - Alternative exercise type migration

### Supabase-Specific
- `supabase-*.sql` - Supabase-specific configurations
- Storage policies and bucket setup
- Edge function configurations

## Usage

### Manual Migration

To apply a migration manually:

```sql
-- Connect to your database and run:
\i migrations/migration-file-name.sql
```

### Via Prisma

Most migrations should be handled through Prisma:

```bash
# Create a new migration
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy
```

### Via Supabase

For Supabase-specific migrations:

```bash
# Run SQL in Supabase Dashboard
# Or use the Supabase CLI
supabase db push
```

## Best Practices

1. **Naming Convention**: Use descriptive names that explain the migration
   - `add-[feature]-field.sql`
   - `migrate-[old]-to-[new].sql`
   - `fix-[issue]-[date].sql`

2. **Idempotency**: Make migrations idempotent when possible
   ```sql
   -- Example
   ALTER TABLE IF EXISTS table_name ADD COLUMN IF NOT EXISTS column_name TEXT;
   ```

3. **Rollback Strategy**: Include rollback instructions or scripts
   ```sql
   -- Migration
   ALTER TABLE exercises ADD COLUMN imageUrl TEXT;
   
   -- Rollback (in comments)
   -- ALTER TABLE exercises DROP COLUMN imageUrl;
   ```

4. **Testing**: Always test migrations on a development database first

5. **Documentation**: Document breaking changes and dependencies

## Migration Workflow

### Development
1. Make schema changes in `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name migration_name`
3. Test the migration locally
4. Commit both the schema and migration files

### Production
1. Review migration files
2. Backup production database
3. Run `npx prisma migrate deploy`
4. Verify the migration succeeded
5. Monitor for issues

## Important Notes

- **Never edit applied migrations** - Create new migrations instead
- **Backup before migrating** - Always backup production data
- **Test thoroughly** - Test migrations in staging/dev first
- **Coordinate deployments** - Sync migrations with code deployments
- **Document dependencies** - Note if migrations require specific data or code

## Prisma Migrations vs SQL Files

This directory contains **manual SQL migrations**. For Prisma-managed migrations, see:
```
prisma/migrations/
```

The files in this `migrations/` directory are for:
- One-off data migrations
- Supabase-specific configurations
- Manual schema adjustments
- Emergency fixes

## Troubleshooting

### Migration Failed
1. Check the error message
2. Review the migration SQL syntax
3. Verify database permissions
4. Check for conflicting migrations

### Need to Rollback
1. Create a rollback migration
2. Apply the rollback
3. Document what went wrong

### Schema Drift
If Prisma detects schema drift:
```bash
# Reset development database
npx prisma migrate reset

# Or resolve drift manually
npx prisma db push
```

## Related Files

- `/prisma/schema.prisma` - Prisma schema definition
- `/prisma/migrations/` - Prisma-managed migrations
- `/scripts/migrate-*.js` - Migration helper scripts
- `/docs/*_MIGRATION_*.md` - Migration documentation
