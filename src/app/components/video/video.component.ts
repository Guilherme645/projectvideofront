import { Component, OnInit } from '@angular/core';
import { VideoService } from 'src/app/service/video.service';

@Component({
  selector: 'app-video',
  templateUrl: './video.component.html',
  styleUrls: ['./video.component.css']
})
export class VideoComponent implements OnInit {
  videos: string[] = []; // Lista de vídeos disponíveis
  selectedVideo: string | null = null; // Vídeo selecionado pelo usuário
  selectedVideoUrl: string | null = null; // URL do vídeo selecionado para reprodução
  range: number[] = [0, 30]; // Range de tempo inicializado com valores padrão (início e fim)
  sliderOptions: any = { floor: 0, ceil: 300 }; // Opções para o slider, ajuste conforme necessário
  currentTime: number = 0; // Tempo atual do vídeo

  constructor(private videoService: VideoService) {}

  ngOnInit(): void {
    // Carregar a lista de vídeos ao inicializar o componente
    this.videoService.listVideos().subscribe(
      (data) => {
        this.videos = data;
      },
      (error) => {
        console.error('Erro ao carregar a lista de vídeos', error);
      }
    );
  }

  // Função para reproduzir o vídeo selecionado
  playVideo(fileName: string): void {
    this.selectedVideoUrl = this.videoService.getVideoUrl(fileName);
  }

  // Função para cortar o vídeo selecionado
  cortarVideo(): void {
    if (this.selectedVideo) {
      const startSeconds = this.range[0];
      const durationSeconds = this.range[1] - this.range[0];
      this.videoService.cutVideo(this.selectedVideo, startSeconds, durationSeconds).subscribe(
        (data) => {
          alert(`Corte feito com sucesso: ${data}`);
        },
        (error) => {
          console.error('Erro ao fazer o corte', error);
        }
      );
    }
  }

  // Função para atualizar o tempo atual do vídeo
  updateCurrentTime(event: Event): void {
    const videoElement = event.target as HTMLVideoElement;
    this.currentTime = videoElement.currentTime;
  }

  // Função para manipular o corte de áudio
  onCutAudio(): void {
    this.cortarVideo();
  }

  // Função para atualizar o tempo ao usar o slider
  seekTo(time: number): void {
    this.currentTime = time;
    const videoElement = document.querySelector('video') as HTMLVideoElement;
    if (videoElement) {
      videoElement.currentTime = time;
    }
  }

  // Função para abrir o diálogo de corte de vídeo
  abrirDialogoCorte(videoName: string): void {
    this.selectedVideo = videoName;
  }
}
