export default function detectLanguage(fileName: string): string {
    const fileExtension = fileName.split('.').pop();
    switch (fileExtension) {
        case 'js': return 'JavaScript';
        case 'ts': return 'TypeScript';
        case 'py': return 'Python';
        case 'java': return 'Java';
        case 'c': return 'C';
        case 'cpp': return 'C++';
        case 'css': return 'CSS';
        case 'html': return 'HTML';
        case 'scss': return 'SCSS';
        case 'sass': return 'SASS';
        case 'less': return 'LESS';
        case 'styl': return 'Stylus';
        case "rb":
            return "Ruby";
        case "php":
            return "PHP";
        case "cs":
            return "C#";
        case "java":
            return "Java";
        case "c":
            return "C";
        case "cpp":
            return "C++";
        case "go":
            return "Go";
        case "swift":
            return "Swift";
        case "kt":
            return "Kotlin";
        case "rs":
            return "Rust";
        case "scala":
            return "Scala";
        case "hs":
            return "Haskell";
        case "elm":
            return "Elm";
        case "clj":
            return "Clojure";
        case "cljs":
            return "ClojureScript";
        case "lisp":
            return "Lisp";
        case "rkt":
            return "Racket";
        case "ml":
            return "OCaml";
        default: return fileExtension || 'Unknown';
    }
}
