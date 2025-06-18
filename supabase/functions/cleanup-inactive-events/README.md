# Cleanup Inactive Events Function

This Supabase Edge Function automatically deletes events and their associated data (expenses, participants) after 30 days of inactivity.

## How It Works

1. The function runs on a daily schedule (at midnight UTC)
2. It checks all events in the database
3. For each event, it finds the most recent activity (latest expense or event creation date)
4. If the most recent activity is older than 30 days, the event and all associated data are deleted
5. The function logs the results and any errors that occur

## Deployment

To deploy this function to your Supabase project:

```bash
# Navigate to your project root
cd /path/to/your/project

# Link to your Supabase project (if not already linked)
supabase link --project-ref your-project-ref

# Deploy the function
supabase functions deploy cleanup-inactive-events --no-verify-jwt

# Deploy the database migrations (for cascade delete constraints)
supabase db push
```

## Testing

You can manually trigger the function for testing:

```bash
# Invoke the function directly
curl -i --location --request POST 'https://your-project-ref.supabase.co/functions/v1/cleanup-inactive-events' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json'
```

## Configuration

The function is scheduled to run once per day at midnight UTC. You can change this by modifying the cron expression in `config.ts`.

## Security

The function uses the service role key to perform database operations, which has full access to your database. The function itself can be called without authentication (`--no-verify-jwt` flag), but it doesn't expose any sensitive data or operations to the caller.

## Monitoring

You can monitor the function's execution in the Supabase dashboard under:
- Functions > Logs
- Database > Logs 