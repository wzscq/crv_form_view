export function getFileBase64(file){
    console.log('getFileBase64',file);
    const reader = new FileReader();
    const base64=reader.readAsDataURL(file);
    console.log('getFileBase64',base64);
    return base64;
}