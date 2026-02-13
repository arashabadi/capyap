#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::io::{Read, Write};
use std::net::{SocketAddr, TcpStream};
use std::path::PathBuf;
use std::process::{Child, Command, Stdio};
use std::thread;
use std::time::{Duration, Instant};

const BACKEND_HEALTH_URL: &str = "http://127.0.0.1:8000/health";
const BACKEND_HOST: &str = "127.0.0.1";
const BACKEND_PORT: &str = "8000";

#[derive(Clone)]
struct LaunchCandidate {
    program: String,
    args: Vec<String>,
}

fn backend_is_healthy() -> bool {
    let socket: SocketAddr = match "127.0.0.1:8000".parse() {
        Ok(addr) => addr,
        Err(_) => return false,
    };

    let mut stream = match TcpStream::connect_timeout(&socket, Duration::from_millis(700)) {
        Ok(stream) => stream,
        Err(_) => return false,
    };

    let _ = stream.set_read_timeout(Some(Duration::from_millis(700)));
    let _ = stream.set_write_timeout(Some(Duration::from_millis(700)));

    let request = b"GET /health HTTP/1.1\r\nHost: 127.0.0.1:8000\r\nConnection: close\r\n\r\n";
    if stream.write_all(request).is_err() {
        return false;
    }

    let mut response = String::new();
    if stream.read_to_string(&mut response).is_err() {
        return false;
    }

    response.starts_with("HTTP/1.1 200") || response.starts_with("HTTP/1.0 200")
}

fn with_capyap_args(program: String) -> LaunchCandidate {
    LaunchCandidate {
        program,
        args: vec![
            "start".to_string(),
            "--no-browser".to_string(),
            "--host".to_string(),
            BACKEND_HOST.to_string(),
            "--port".to_string(),
            BACKEND_PORT.to_string(),
        ],
    }
}

fn with_python_module_args(program: String) -> LaunchCandidate {
    LaunchCandidate {
        program,
        args: vec![
            "-m".to_string(),
            "youtube_video_summarizer.capyap_cli".to_string(),
            "start".to_string(),
            "--no-browser".to_string(),
            "--host".to_string(),
            BACKEND_HOST.to_string(),
            "--port".to_string(),
            BACKEND_PORT.to_string(),
        ],
    }
}

fn with_conda_env_args(program: String, env_name: &str) -> LaunchCandidate {
    LaunchCandidate {
        program,
        args: vec![
            "run".to_string(),
            "-n".to_string(),
            env_name.to_string(),
            "capyap".to_string(),
            "start".to_string(),
            "--no-browser".to_string(),
            "--host".to_string(),
            BACKEND_HOST.to_string(),
            "--port".to_string(),
            BACKEND_PORT.to_string(),
        ],
    }
}

fn existing_path(path: PathBuf) -> Option<String> {
    if path.exists() {
        return Some(path.to_string_lossy().to_string());
    }
    None
}

fn inferred_home_dirs() -> Vec<PathBuf> {
    let mut homes: Vec<PathBuf> = Vec::new();

    if let Ok(home) = std::env::var("HOME") {
        let path = PathBuf::from(home);
        if path.exists() {
            homes.push(path);
        }
    }

    if let Ok(exe) = std::env::current_exe() {
        let exe_str = exe.to_string_lossy();
        if let Some(rest) = exe_str.strip_prefix("/Users/") {
            if let Some(user) = rest.split('/').next() {
                let path = PathBuf::from(format!("/Users/{}", user));
                if path.exists() {
                    homes.push(path);
                }
            }
        }
        if let Some(rest) = exe_str.strip_prefix("/home/") {
            if let Some(user) = rest.split('/').next() {
                let path = PathBuf::from(format!("/home/{}", user));
                if path.exists() {
                    homes.push(path);
                }
            }
        }
    }

    let mut deduped: Vec<PathBuf> = Vec::new();
    for home in homes {
        if !deduped.iter().any(|existing| existing == &home) {
            deduped.push(home);
        }
    }

    deduped
}

fn launch_candidates() -> Vec<LaunchCandidate> {
    let mut candidates: Vec<LaunchCandidate> = vec![
        with_capyap_args("capyap".to_string()),
        with_conda_env_args("conda".to_string(), "capyap"),
        with_conda_env_args("conda".to_string(), "capyap_dev"),
    ];

    for home in inferred_home_dirs() {
        let known_capyap_bins = [
            home.join("miniconda3/bin/capyap"),
            home.join("anaconda3/bin/capyap"),
            home.join("opt/miniconda3/bin/capyap"),
        ];
        for path in known_capyap_bins {
            if let Some(bin) = existing_path(path) {
                candidates.push(with_capyap_args(bin));
            }
        }

        let known_conda_bins = [
            home.join("miniconda3/bin/conda"),
            home.join("anaconda3/bin/conda"),
            home.join("opt/miniconda3/bin/conda"),
        ];
        for path in known_conda_bins {
            if let Some(bin) = existing_path(path) {
                candidates.push(with_conda_env_args(bin.clone(), "capyap"));
                candidates.push(with_conda_env_args(bin, "capyap_dev"));
            }
        }

        let known_python_bins = [
            home.join("miniconda3/bin/python"),
            home.join("anaconda3/bin/python"),
            home.join("opt/miniconda3/bin/python"),
        ];
        for path in known_python_bins {
            if let Some(bin) = existing_path(path) {
                candidates.push(with_python_module_args(bin));
            }
        }
    }

    candidates.push(with_python_module_args("python3".to_string()));
    candidates.push(with_python_module_args("python".to_string()));
    candidates
}

fn wait_for_backend_ready(max_wait: Duration, child: &mut Child) -> bool {
    let start = Instant::now();
    while start.elapsed() < max_wait {
        if backend_is_healthy() {
            return true;
        }

        if let Ok(Some(_status)) = child.try_wait() {
            return false;
        }

        thread::sleep(Duration::from_millis(350));
    }
    false
}

fn try_spawn_backend(candidate: &LaunchCandidate) -> Option<Child> {
    let mut command = Command::new(&candidate.program);
    command
        .args(&candidate.args)
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null());

    match command.spawn() {
        Ok(child) => Some(child),
        Err(err) => {
            eprintln!(
                "Capyap desktop: failed backend launch candidate {} ({})",
                candidate.program, err
            );
            None
        }
    }
}

fn ensure_backend() -> Option<Child> {
    if backend_is_healthy() {
        eprintln!("Capyap desktop: backend already reachable at {}", BACKEND_HEALTH_URL);
        return None;
    }

    for candidate in launch_candidates() {
        eprintln!(
            "Capyap desktop: trying backend launch candidate {} {:?}",
            candidate.program, candidate.args
        );
        let Some(mut child) = try_spawn_backend(&candidate) else {
            continue;
        };

        if wait_for_backend_ready(Duration::from_secs(22), &mut child) {
            eprintln!(
                "Capyap desktop: backend auto-started using {}",
                candidate.program
            );
            return Some(child);
        }

        match child.try_wait() {
            Ok(Some(status)) => {
                eprintln!(
                    "Capyap desktop: backend launch candidate {} exited early ({})",
                    candidate.program, status
                );
            }
            Ok(None) => {
                eprintln!(
                    "Capyap desktop: backend launch candidate {} timed out waiting for health",
                    candidate.program
                );
            }
            Err(err) => {
                eprintln!(
                    "Capyap desktop: backend launch candidate {} status check failed ({})",
                    candidate.program, err
                );
            }
        }

        let _ = child.kill();
        let _ = child.wait();
    }

    eprintln!(
        "Capyap desktop: backend auto-start failed. Launch manually with `capyap start --no-browser`."
    );
    None
}

fn stop_backend(mut child: Child) {
    let _ = child.kill();
    let _ = child.wait();
}

#[tauri::command]
fn open_external_url(url: String) -> Result<(), String> {
    let trimmed = url.trim();
    if trimmed.is_empty() {
        return Err("URL is empty.".to_string());
    }
    if !trimmed.starts_with("http://") && !trimmed.starts_with("https://") {
        return Err("Only http/https URLs are supported.".to_string());
    }

    #[cfg(target_os = "macos")]
    let mut command = {
        let mut cmd = Command::new("open");
        cmd.arg(trimmed);
        cmd
    };

    #[cfg(target_os = "linux")]
    let mut command = {
        let mut cmd = Command::new("xdg-open");
        cmd.arg(trimmed);
        cmd
    };

    #[cfg(target_os = "windows")]
    let mut command = {
        let mut cmd = Command::new("rundll32");
        cmd.arg("url.dll,FileProtocolHandler");
        cmd.arg(trimmed);
        cmd
    };

    command
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
        .map_err(|err| format!("Failed to open URL in system browser: {err}"))?;

    Ok(())
}

fn main() {
    let mut backend_child = ensure_backend();

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![open_external_url])
        .build(tauri::generate_context!())
        .expect("error while building Capyap desktop app")
        .run(move |_app_handle, event| {
            if matches!(
                event,
                tauri::RunEvent::Exit | tauri::RunEvent::ExitRequested { .. }
            ) {
                if let Some(child) = backend_child.take() {
                    stop_backend(child);
                }
            }
        });
}
