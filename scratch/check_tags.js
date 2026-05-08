const fs = require('fs');
const content = fs.readFileSync('d:\\FATURAÇÂO\\vet-connect-saas\\src\\app\\dashboard\\calendar\\page.tsx', 'utf8');

let stack = [];
let regex = /<\/?([a-zA-Z0-9]+)/g;
let match;

while ((match = regex.exec(content)) !== null) {
    let tag = match[1];
    if (match[0].startsWith('</')) {
        if (stack.length === 0) {
            console.log(`Extra closing tag: ${tag} at index ${match.index}`);
        } else {
            let last = stack.pop();
            if (last !== tag) {
                console.log(`Mismatched tag: expected ${last}, got ${tag} at index ${match.index}`);
            }
        }
    } else {
        // Skip self-closing tags (simplified)
        let endOfTag = content.indexOf('>', match.index);
        if (content[endOfTag - 1] !== '/') {
            stack.push(tag);
        }
    }
}

if (stack.length > 0) {
    console.log(`Unclosed tags: ${stack.join(', ')}`);
} else {
    console.log('All tags matched!');
}
