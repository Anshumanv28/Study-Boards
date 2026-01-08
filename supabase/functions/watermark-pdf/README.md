# Watermark PDF Edge Function

This Supabase Edge Function applies watermarks to PDF files before serving them to authenticated users.

## Features

- Validates Supabase authentication
- Fetches PDFs from URLs or S3/Supabase Storage
- Applies diagonal watermarks across all pages
- Returns watermarked PDF with proper headers

## Environment Variables

Set these in your Supabase project settings (Edge Functions secrets):

- `SUPABASE_URL`: Your Supabase project URL (automatically available)
- `SUPABASE_ANON_KEY`: Your Supabase anon key (automatically available)
- `WATERMARK_TEXT`: Custom watermark text (optional, defaults to "StudyBoards - Confidential")
- `S3_BUCKET_NAME`: S3 bucket name (optional, defaults to "Boards-study")

## Request Format

```json
{
  "pdfUrl": "https://example.com/file.pdf",  // Optional: Full URL to PDF
  "s3Key": "topic/filename.pdf",              // Optional: S3 key path
  "watermarkText": "Custom Text"              // Optional: Custom watermark text
}
```

Either `pdfUrl` or `s3Key` must be provided.

## Response

Returns the watermarked PDF as `application/pdf` with appropriate headers.

## Authentication

Requires a valid Supabase JWT token in the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

## Deployment

```bash
supabase functions deploy watermark-pdf
```

## Watermark Settings

- Diagonal watermarks at -45 degrees
- Full page coverage
- Opacity: 0.3
- Color: Light gray (rgb(0.7, 0.7, 0.7))
- Font size: 6% of smaller page dimension
- Spacing multiplier: 0.7
