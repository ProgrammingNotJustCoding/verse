pub mod db;
pub mod redis;
pub mod ollama;
pub mod minio;

pub use db::*;
pub use redis::*;
pub use ollama::*;
pub use minio::*;

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkerConfig {
    pub worker_id: String,
    pub max_concurrent_jobs: usize,
    pub timeout_seconds: u64,
    pub retry_attempts: u32,
}

impl Default for WorkerConfig {
    fn default() -> Self {
        Self {
            worker_id: "default-worker".to_string(),
            max_concurrent_jobs: 4,
            timeout_seconds: 300,
            retry_attempts: 3,
        }
    }
}
