exports.truncate = (string, length) => {
  if (!string)
    return ""
  if (!length || string.length <= length)
    return string
  // Slice the string to required length
  let truncated = string.substring(0, length)
  // Trim space from end
  if (truncated.endsWith(" "))
    truncated = truncated
      .split("")
      .slice(0, length - 1)
      .join("")
  // Add ellipsis
  truncated += "..."
  return truncated
}