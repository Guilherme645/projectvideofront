import { Component, OnInit, ViewChild } from '@angular/core';
import { VideoService } from 'src/app/service/video.service';
import { Options } from '@angular-slider/ngx-slider';

@Component({
  selector: 'app-video',
  templateUrl: './video.component.html',
  styleUrls: ['./video.component.css']
})
export class VideoComponent implements OnInit {
  videos: string[] = []; // Lista de vídeos disponíveis
  selectedVideo: string | null = null; // Vídeo selecionado
  selectedVideoUrl: string | null = null; // URL do vídeo selecionado para reprodução
  currentTime: number = 0; // Tempo atual do vídeo
  range: number[] = [0, 30]; // Range de corte
  videoDuration: number = 100; // Duração simulada do vídeo (atualizado ao carregar o vídeo)
  isLooping: boolean = false; // Define se o vídeo está em loop

  sliderOptions: Options = { floor: 0, ceil: 100, step: 0.1 }; // Opções do slider de reprodução
  cutSliderOptions: Options = { floor: 0, ceil: 100, step: 0.1 }; // Opções do slider de corte

  @ViewChild('videoPlayer') videoPlayer: any;

  constructor(private videoService: VideoService) {}

  ngOnInit(): void {
    this.videoService.listVideos().subscribe(
      (data) => {
        this.videos = data;
      },
      (error) => {
        console.error('Erro ao carregar a lista de vídeos', error);
      }
    );
  }

  // Reproduzir o vídeo selecionado e ajustar a duração do slider
  playVideo(fileName: string): void {
    this.selectedVideoUrl = this.videoService.getVideoUrl(fileName);

    // Atualizar os sliders com a duração real do vídeo após o carregamento
    setTimeout(() => {
      const videoElement = this.videoPlayer.nativeElement;
      this.videoDuration = videoElement.duration;
      this.sliderOptions.ceil = this.videoDuration;
      this.cutSliderOptions.ceil = this.videoDuration;
    }, 500); // Delay para garantir que o vídeo seja carregado
  }

  updateCurrentTime(event: Event): void {
    const videoElement = event.target as HTMLVideoElement;
    this.currentTime = videoElement.currentTime;

    if (this.isLooping && this.currentTime >= this.range[1]) {
      videoElement.pause(); // Pausa o vídeo antes de alterar o tempo
      videoElement.currentTime = this.range[0]; // Define o tempo para o início do intervalo
      setTimeout(() => {
        videoElement.play(); // Reproduz novamente após um pequeno atraso
      }, 100); // Pequeno atraso para evitar travamentos
    }
  }

  // Alterar o tempo de reprodução do vídeo ao ajustar o slider de reprodução
  onSeek(value: number): void {
    const videoElement = this.videoPlayer.nativeElement;
    videoElement.currentTime = value;
  }

  // Atualiza o tempo do vídeo ao ajustar manualmente os inputs de tempo
  seekTo(time: number): void {
    const videoElement = this.videoPlayer.nativeElement;
    videoElement.currentTime = time;
  }

  // Função para realizar o corte do vídeo
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


  // Reproduz o vídeo apenas no intervalo selecionado
  playBetween(): void {
    const videoElement = this.videoPlayer.nativeElement;
    videoElement.currentTime = this.range[0];
    videoElement.play();
  }

  // Ativa ou desativa o loop entre o intervalo de corte
  toggleLoop(): void {
    this.isLooping = !this.isLooping;
    const videoElement = this.videoPlayer.nativeElement;
    if (this.isLooping) {
      console.log('Looping ativado');
      videoElement.currentTime = this.range[0];
      videoElement.play();
    } else {
      console.log('Looping desativado');
    }
  }
}
