import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VideoService {
  private apiUrl = 'http://localhost:8080/videos'; // Ajuste conforme necessário

  constructor(private http: HttpClient) {}

  // Método para listar todos os vídeos
  listVideos(): Observable<any> {
    return this.http.get(`${this.apiUrl}/list`);
  }

  // Método para reproduzir o vídeo
  getVideoUrl(fileName: string): string {
    return `${this.apiUrl}/play/${fileName}`;
  }

  // Método para cortar um vídeo
  cutVideo(fileName: string, startSeconds: number, durationSeconds: number): Observable<any> {
    // Definir os parâmetros que serão enviados
    const params = new HttpParams()
      .set('fileName', fileName)
      .set('startSeconds', startSeconds.toString())
      .set('durationSeconds', durationSeconds.toString());

    // Fazer a requisição POST passando os parâmetros via URL
    return this.http.post(`${this.apiUrl}/cut`, null, { params });
  }
}
