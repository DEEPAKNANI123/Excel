$content = Get-Content src/App.jsx
$content = $content -replace "from\('themes'\)", "from('global_themes')"
$content | Set-Content src/App.jsx
