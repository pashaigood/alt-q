export function removeComment(code: string, language: string) {
  let lines = code.split('\n');
  let result = [];
  switch (language) {
    case 'Python':
    case 'Ruby':
    case 'Bash':
      for (let line of lines) {
        if (line.trim().startsWith('#')) {
          continue;
        }
        result.push(line);
      }
      break;
    case 'JavaScript':
    case 'TypeScript':
    case 'C':
    case 'C++':
    case 'Java':
    case 'C#':
      for (let line of lines) {
        if (line.trim().startsWith('//')) {
          continue;
        }
        result.push(line);
      }
      break;
    case 'PHP':
      for (let line of lines) {
        if (line.trim().startsWith('//') || line.trim().startsWith('#')) {
          continue;
        }
        result.push(line);
      }
      break;
    default:
      throw new Error('Unsupported language');
  }
  return result.join('\n');
}

export function removeCommentStart(code: string, language: string) {
  let lines = code.split('\n');
  let result = [];
  switch (language) {

    case 'Python':
    case 'Ruby':
    case 'Bash':
      for (let line of lines) {
        if (line.trim().startsWith('#')) {
          result.push(line.replace(/^#\s*/, ''));
          continue;
        }
        result.push(line);
      }
      break;
    case 'JavaScript':
    case 'TypeScript':
    case 'C':
    case 'C++':
    case 'Java':
    case 'C#':
      for (let line of lines) {
        if (line.trim().startsWith('//')) {
          result.push(line.replace(/^\/\/\s*/, ''));
          continue;
        }
        result.push(line);
      }
      break;
    case 'PHP':
      for (let line of lines) {
        if (line.trim().startsWith('//')) {
          result.push(line.replace(/^\/\/\s*/, ''));
        } else if (line.trim().startsWith('#')) {
          result.push(line.replace(/^#\s*/, ''));
        } else {
          result.push(line);
        }
      }
      break;
    default:
      throw new Error('Unsupported language');
  }
  return result.join('\n');
}

