const KEYRING_SERVICE: &str = "app.lepse.Lepse";

#[tauri::command(async)]
pub async fn get_secret(key: &str) -> Result<String, String> {
  #[cfg(target_os = "linux")]
  {
    let keyring = oo7::Keyring::new().await.map_err(|e| e.to_string())?;

    // Get item, there should only be one
    let items = keyring
      .search_items(&[(KEYRING_SERVICE, key)])
      .await
      .map_err(|e| e.to_string())?;
    let Some(item) = items.first() else {
      return Ok(String::new()); // secret not found, send empty string
    };

    // Extract secret from item
    let secret = item.secret().await.map_err(|e| e.to_string())?;
    let secret_str = match &secret {
      oo7::Secret::Text(s) => s,
      oo7::Secret::Blob(_) => return Err("Expected text secret, but got blob".to_string()),
    }
    .to_string();

    Ok(secret_str)
  }
  #[cfg(any(target_os = "windows", target_os = "macos"))]
  {
    let e = keyring_core::Entry::new(KEYRING_SERVICE, key).map_err(|e| e.to_string())?;
    e.get_password().or_else(|_| Ok(String::new()))
  }
}

#[tauri::command(async)]
pub async fn set_secret(key: &str, password: &str) -> Result<(), String> {
  #[cfg(target_os = "linux")]
  {
    let keyring = oo7::Keyring::new().await.map_err(|e| e.to_string())?;

    // Create item
    keyring
      .create_item(
        format!("{}:{}", KEYRING_SERVICE, key).as_str(), // sole purpose of keeping the same interface for usage with keyring-core
        &[(KEYRING_SERVICE, key)],
        password,
        true,
      )
      .await
      .map_err(|e| e.to_string())?;

    Ok(())
  }
  #[cfg(any(target_os = "windows", target_os = "macos"))]
  {
    let e = keyring_core::Entry::new(KEYRING_SERVICE, key).map_err(|e| e.to_string())?;
    e.set_password(password).map_err(|e| e.to_string())
  }
}

#[tauri::command(async)]
pub async fn delete_secret(key: &str) -> Result<(), String> {
  #[cfg(target_os = "linux")]
  {
    let keyring = oo7::Keyring::new().await.map_err(|e| e.to_string())?;

    // Get item, there should only be one
    let items = keyring
      .search_items(&[(KEYRING_SERVICE, key)])
      .await
      .map_err(|e| e.to_string())?;
    let item = items
      .first()
      .ok_or_else(|| "Secret not found".to_string())?;

    // Delete item
    item.delete().await.map_err(|e| e.to_string())?;

    Ok(())
  }
  #[cfg(any(target_os = "windows", target_os = "macos"))]
  {
    let e = keyring_core::Entry::new(KEYRING_SERVICE, key).map_err(|e| e.to_string())?;
    e.delete_credential().map_err(|e| e.to_string())
  }
}
