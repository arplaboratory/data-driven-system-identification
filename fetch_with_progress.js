export async function fetchWithProgress(url, onProgress) {
    const response = await fetch(url);
    const reader = response.body.getReader();
    const contentLength = +response.headers.get('Content-Length');
    
    let receivedLength = 0;
    let chunks = [];
    while(true) {
        const {done, value} = await reader.read();
        
        if (done) {
            break;
        }
        
        chunks.push(value);
        receivedLength += value.length;
        
        onProgress(receivedLength, contentLength);
    }

    let chunksAll = new Uint8Array(receivedLength);
    let position = 0;
    for(let chunk of chunks) {
        chunksAll.set(chunk, position);
        position += chunk.length;
    }

    return chunksAll
}
