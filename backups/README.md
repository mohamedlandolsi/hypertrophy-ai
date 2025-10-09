# Backups

This directory contains backup files and archived data from the HypertroQ application.

## Directory Contents

- **Database Backups**: JSON exports of database data
- **Configuration Backups**: Saved configurations and settings
- **Test Data**: Test JSON files and mock data
- **Debug Outputs**: JSON files from debugging sessions

## Files in This Directory

### Database Backups
- `backup-*.json` - Full or partial database exports with timestamps
- Format: `backup-YYYY-MM-DDTHH-MM-SS-SSSZ.json`

### Configuration Archives
- `package-test.json` - Test package configurations
- `debug-prompt-analysis.json` - AI prompt analysis backups

## Creating Backups

### Manual Database Backup

Use the backup script:
```bash
node scripts/backup-data.js
```

### Custom Backup
```javascript
// Example: Backup specific data
const backup = {
  timestamp: new Date().toISOString(),
  data: yourData
};

fs.writeFileSync(
  `backups/backup-${backup.timestamp}.json`,
  JSON.stringify(backup, null, 2)
);
```

## Restoring from Backup

### Review Backup Contents
```bash
# View backup file
cat backups/backup-YYYY-MM-DDTHH-MM-SS-SSSZ.json | jq
```

### Restore Data
```javascript
// Load backup
const backup = JSON.parse(
  fs.readFileSync('backups/backup-file.json', 'utf-8')
);

// Restore to database
// (implement your restoration logic)
```

## Best Practices

1. **Regular Backups**: Schedule automatic backups for production
2. **Naming Convention**: Use timestamps in ISO format
3. **Compression**: Compress large backups (gzip)
4. **Retention Policy**: Archive or delete old backups periodically
5. **Verification**: Verify backup integrity after creation
6. **Off-site Storage**: Store critical backups off-site or in cloud storage

## Backup Schedule Recommendations

### Development
- Before major migrations
- Before destructive operations
- Before production deployments

### Production
- Daily automated backups
- Before each deployment
- Before schema changes
- Weekly full database backups

## File Management

### Automatic Cleanup
Consider implementing automatic cleanup of old backups:

```bash
# Keep only backups from last 30 days
find backups/ -name "backup-*.json" -mtime +30 -delete
```

### Compression
For large backups:

```bash
# Compress backup
gzip backups/backup-large-file.json

# Decompress when needed
gunzip backups/backup-large-file.json.gz
```

## Security

- **Sensitive Data**: Never commit backups with sensitive data to git
- **Encryption**: Consider encrypting backups containing user data
- **Access Control**: Restrict access to backup files
- **Git Ignore**: Ensure backups are in `.gitignore`

## Related Files

- `/scripts/backup-data.js` - Backup script
- `/.gitignore` - Ensures backups aren't committed
- `/docs/DATABASE_SCHEMA_CLEANUP.md` - Database documentation

## Important Notes

⚠️ **Never commit sensitive backups to version control**

✅ Backups in this directory are gitignored by default

📦 For production backups, use external storage services

🔄 Implement automated backup verification

## Emergency Recovery

In case of data loss:

1. **Stop the application** to prevent further changes
2. **Identify the correct backup** based on timestamp
3. **Verify backup integrity** before restoring
4. **Create a backup of current state** (even if corrupted)
5. **Restore from backup** using restoration scripts
6. **Verify restoration** thoroughly
7. **Document the incident** and update procedures
