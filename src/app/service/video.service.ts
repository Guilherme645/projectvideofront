import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VideoService {
  private apiUrl = 'http://localhost:8080/videos'; // Ajuste conforme necessário

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
}}