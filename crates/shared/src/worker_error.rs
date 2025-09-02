use thiserror::Error;

#[derive(Error, Debug)]
pub enum WorkerError {
    #[error("Network error: {0}")]
    Network(String),

    #[error("Processing error: {0}")]
    Processing(String),

    #[error("Configuration error: {0}")]
    Configuration(String),

    #[error("IO error: {0}")]
    IO(String),

    #[error("Timeout error: operation took longer than {timeout}s")]
    Timeout { timeout: u64 },

    #[error("Validation error: {0}")]
    Validation(String),

    #[error("External service error: {service} - {message}")]
    ExternalService { service: String, message: String },
}

impl WorkerError {
    pub fn network<T: Into<String>>(msg: T) -> Self {
        WorkerError::Network(msg.into())
    }

    pub fn processing<T: Into<String>>(msg: T) -> Self {
        WorkerError::Processing(msg.into())
    }

    pub fn configuration<T: Into<String>>(msg: T) -> Self {
        WorkerError::Configuration(msg.into())
    }

    pub fn io<T: Into<String>>(msg: T) -> Self {
        WorkerError::IO(msg.into())
    }

    pub fn timeout(timeout: u64) -> Self {
        WorkerError::Timeout { timeout }
    }

    pub fn validation<T: Into<String>>(msg: T) -> Self {
        WorkerError::Validation(msg.into())
    }

    pub fn external_service<T: Into<String>, U: Into<String>>(service: T, message: U) -> Self {
        WorkerError::ExternalService {
            service: service.into(),
            message: message.into(),
        }
    }
}
