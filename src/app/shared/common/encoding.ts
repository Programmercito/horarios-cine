export class EncodingCine {
    codificarBase64(str: string) {
        return btoa(unescape(encodeURIComponent(str)));
    }
    decodificarBase64(base64: string) {
        return decodeURIComponent(escape(atob(base64)));
    }

}