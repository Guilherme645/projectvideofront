import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VideoService {
  public apiUrl = 'http://localhost:8080/videos'; 

  constructor(private http: HttpClient) {}

   listVideosFromFolder(folderName: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/list/${folderName}`);
  }
   getVideoUrl(folderName: string, fileName: string): string {
    return `${this.apiUrl}/play/${folderName}/${fileName}`;
  }
  listFolders(): Observable<any> {
    return this.http.get(`${this.apiUrl}/folders`);
  }
  cutVideo(folderName: string, fileName: string, startSeconds: number, durationSeconds: number): Observable<any> {
    const params = new HttpParams()
      .set('folderName', folderName)
      .set('fileName', fileName)
      .set('startSeconds', startSeconds.toString())
      .set('durationSeconds', durationSeconds.toString());

    return this.http.post(`${this.apiUrl}/cut`, null, { params });
}

 listCutFolders(): Observable<string[]> {
  return this.http.get<string[]>(`${this.apiUrl}/cuts/folders`);
}

listVideosFromCutFolder(folderName: string): Observable<string[]> {
  const headers = new HttpHeaders({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}` 
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
  getCutProgress(folderName: string, fileName: string): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/video/cut/progress/${folderName}/${fileName}`);
  }
}
