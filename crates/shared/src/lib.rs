pub mod logger;
pub mod response;
pub mod worker_error;

pub use logger::*;
pub use response::*;
pub use worker_error::*;

use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Job {
    pub id: Uuid,
    pub input_url: String,
    pub output_url: Option<String>,
    pub status: JobStatus,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub completed_at: Option<chrono::DateTime<chrono::Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum JobStatus {
    Pending,
    Processing,
    Completed,
    Failed,
}
