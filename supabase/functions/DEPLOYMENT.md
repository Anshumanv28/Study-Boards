# Deploying Supabase Edge Functions

This guide explains how to deploy the `watermark-pdf` Edge Function to your Supabase project.

## Prerequisites

1. **Install Supabase CLI** (choose one method):

   **Option A: Using winget (Windows Package Manager - Recommended for Windows)**

   ```powershell
   winget install --id=Supabase.CLI
   ```

   **Option B: Using Scoop**

   ```powershell
   scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
   scoop install supabase
   ```

   **Option C: Using Chocolatey**

   ```powershell
   choco install supabase
   ```

   **Option D: Direct Download (Manual)**

   - Download from: https://github.com/supabase/cli/releases
   - Extract and add to your PATH

   **Note:** `npm install -g supabase` is NOT supported. Use one of the methods above.

2. **Verify Installation**

   ```bash
   supabase --version
   ```

3. **Login to Supabase**

   ```bash
   supabase login
   ```

4. **Link your project** (if not already linked)

   ```bash
   supabase link --project-ref your-project-ref
   ```

   You can find your project ref in your Supabase dashboard URL:

   - Example: `https://supabase.com/dashboard/project/xbrtqfisytoamfvdmqkp`
   - Project ref: `xbrtqfisytoamfvdmqkp`

## Deployment Steps

### Option 1: Deploy from Project Root (Recommended)

From the root of your project:

```bash
# Deploy the watermark-pdf function
# Use --no-verify-jwt to allow unauthenticated access (function works with or without auth)
supabase functions deploy watermark-pdf --no-verify-jwt
```

### Option 2: Deploy from Functions Directory

```bash
cd supabase/functions
supabase functions deploy watermark-pdf
```

### Option 3: Deploy All Functions

```bash
supabase functions deploy
```

## Setting Environment Variables

After deployment, set environment variables in the Supabase Dashboard:

1. Go to your Supabase project dashboard
2. Navigate to **Edge Functions** → **watermark-pdf**
3. Click on **Settings** or **Secrets**
4. Add the following secrets:

   - `WATERMARK_TEXT` (optional): Custom watermark text

     - Default: `"StudyBoards - Confidential"`

   - `S3_BUCKET_NAME` (optional): Your S3 bucket name
     - Default: `"Boards-study"`

**Note:** `SUPABASE_URL` and `SUPABASE_ANON_KEY` are automatically available to Edge Functions, so you don't need to set them manually.

### Using CLI to Set Secrets

You can also set secrets via CLI:

```bash
# Set watermark text
supabase secrets set WATERMARK_TEXT="Your Custom Text"

# Set S3 bucket name
supabase secrets set S3_BUCKET_NAME="Boards-study"
```

## Verify Deployment

1. **Check function status in dashboard:**

   - Go to **Edge Functions** in your Supabase dashboard
   - You should see `watermark-pdf` listed

2. **Test the function:**

   ```bash
   # Get your function URL
   # Format: https://<project-ref>.functions.supabase.co/watermark-pdf

   # Test with curl (replace with your actual values)
   curl -X POST https://xbrtqfisytoamfvdmqkp.functions.supabase.co/watermark-pdf \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "apikey: YOUR_ANON_KEY" \
     -d '{
       "pdfUrl": "https://example.com/test.pdf",
       "watermarkText": "Test Watermark"
     }'
   ```

## Troubleshooting

### Error: "Project not linked"

```bash
supabase link --project-ref your-project-ref
```

### Error: "Not logged in"

```bash
supabase login
```

### Error: "Function not found"

Make sure you're in the correct directory and the function folder exists at:

```
supabase/functions/watermark-pdf/index.ts
```

### CORS Issues

The Edge Function includes CORS headers. If you still see CORS errors:

1. Check that the function is deployed correctly
2. Verify the `corsHeaders` in `index.ts` include your origin
3. Make sure OPTIONS requests return status 200 (not 204)

## Updating the Function

To update an already deployed function:

```bash
# Make your changes to supabase/functions/watermark-pdf/index.ts
# Then redeploy:
supabase functions deploy watermark-pdf
```

## Function URL

After deployment, your function will be available at:

```
https://<your-project-ref>.functions.supabase.co/watermark-pdf
```

Example:

```
https://xbrtqfisytoamfvdmqkp.functions.supabase.co/watermark-pdf
```

## Next Steps

After deployment:

1. Update your frontend environment variables if needed
2. Test PDF viewing with watermarks
3. Verify that all PDFs are being watermarked correctly
