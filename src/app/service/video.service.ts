import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VideoService {
  public apiUrl = 'http://localhost:8080/videos'; // Ajuste conforme necessário

  constructor(private http: HttpClient) {}

   // Método para listar todos os vídeos dentro de uma pasta
   listVideosFromFolder(folderName: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/list/${folderName}`);
  }
   // Método para gerar a URL de reprodução do vídeo
   getVideoUrl(folderName: string, fileName: string): string {
    return `${this.apiUrl}/play/${folderName}/${fileName}`;
  }
  listFolders(): Observable<any> {
    return this.http.get(`${this.apiUrl}/folders`);
  }
  // Método para cortar um vídeo
  cutVideo(folderName: string, fileName: string, startSeconds: number, durationSeconds: number): Observable<any> {
    // Definir os parâmetros que serão enviados
    const params = new HttpParams()
      .set('folderName', folderName)
      .set('fileName', fileName)
      .set('startSeconds', startSeconds.toString())
      .set('durationSeconds', durationSeconds.toString());

    // Fazer a requisição POST passando os parâmetros via URL
    return this.http.post(`${this.apiUrl}/cut`, null, { params });
}

 // Método para listar todas as subpastas de C:/cortesvideos
 listCutFolders(): Observable<string[]> {
  return this.http.get<string[]>(`${this.apiUrl}/cuts/folders`);
}

// Método para listar vídeos dentro de uma subpasta específica de C:/cortesvideos
listVideosFromCutFolder(folderName: string): Observable<string[]> {
  const headers = new HttpHeaders({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`  // Supondo que você utilize JWT
  });
  return this.http.get<string[]>(`${this.apiUrl}/cuts/list/${folderName}`, { headers });
}
getCutVideoUrl(folderName: string, fileName: string): string {
  return `${this.apiUrl}/cuts/play/${folderName}/${fileName}`;
}

uploadVideo(file: File, subFolderName: string): Observable<any> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('subFolderName', subFolderName);

  return this.http.post(`${this.apiUrl}/upload`, formData, { responseType: 'text' });
}
  // Método para monitorar o progresso do corte
  getCutProgress(folderName: string, fileName: string): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/video/cut/progress/${folderName}/${fileName}`);
  }
}
