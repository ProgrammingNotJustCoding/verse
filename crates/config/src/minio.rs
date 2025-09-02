use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MinioConfig {
    pub endpoint: String,
    pub access_key: String,
    pub secret_key: String,
    pub region: Option<String>,
    pub secure: bool,
    pub buckets: MinioBuckets,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MinioBuckets {
    pub uploads: String,
    pub processed: String,
    pub thumbnails: String,
    pub temp: String,
}

impl Default for MinioConfig {
    fn default() -> Self {
        Self {
            endpoint: "localhost:9000".to_string(),
            access_key: "minioadmin".to_string(),
            secret_key: "minioadmin123".to_string(),
            region: Some("us-east-1".to_string()),
            secure: false,
            buckets: MinioBuckets::default(),
        }
    }
}

impl Default for MinioBuckets {
    fn default() -> Self {
        Self {
            uploads: "uploads".to_string(),
            processed: "processed".to_string(),
            thumbnails: "thumbnails".to_string(),
            temp: "temp".to_string(),
        }
    }
}

impl MinioConfig {
    pub fn from_env() -> Self {
        Self {
            endpoint: std::env::var("MINIO_ENDPOINT").unwrap_or_else(|_| "localhost:9000".to_string()),
            access_key: std::env::var("MINIO_ACCESS_KEY").unwrap_or_else(|_| "minioadmin".to_string()),
            secret_key: std::env::var("MINIO_SECRET_KEY").unwrap_or_else(|_| "minioadmin123".to_string()),
            region: std::env::var("MINIO_REGION").ok(),
            secure: std::env::var("MINIO_SECURE").unwrap_or_else(|_| "false".to_string()).parse().unwrap_or(false),
            buckets: MinioBuckets {
                uploads: std::env::var("MINIO_BUCKET_UPLOADS").unwrap_or_else(|_| "uploads".to_string()),
                processed: std::env::var("MINIO_BUCKET_PROCESSED").unwrap_or_else(|_| "processed".to_string()),
                thumbnails: std::env::var("MINIO_BUCKET_THUMBNAILS").unwrap_or_else(|_| "thumbnails".to_string()),
                temp: std::env::var("MINIO_BUCKET_TEMP").unwrap_or_else(|_| "temp".to_string()),
            },
        }
    }
}
