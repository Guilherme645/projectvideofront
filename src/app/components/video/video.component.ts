import { Options } from '@angular-slider/ngx-slider';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { VideoService } from 'src/app/service/video.service';

@Component({
  selector: 'app-video',
  templateUrl: './video.component.html',
  styleUrls: ['./video.component.css']
})
export class VideoComponent implements OnInit {
  @ViewChild('videoPlayer', { static: false }) videoPlayer!: ElementRef;
  videos: string[] = []; // Lista de vídeos disponíveis
  selectedVideo: string | null = null; // Vídeo selecionado pelo usuário
  currentTime: number = 0; // Tempo atual do vídeo
  folders: string[] = [];
  selectedFolder: string | null = null;
  isLooping: boolean = false;  // Controle de loop
  cutSliderOptions: Options = { floor: 0, ceil: 100, step: 0.1 }; // Opções do slider de corte
  endTime: number = 0;
  selectedVideoUrl: string = '';
  videoDuration: number = 0;
  range: number[] = [0, 30];
  sliderOptions = {
    floor: 0,
    ceil: 100
  };

 
  constructor(private videoService: VideoService) {}

  ngOnInit(): void {
    // Carrega a lista de pastas ao iniciar o componente
    this.loadFolders();
  }

  playVideo(fileName: string): void {
  if (this.selectedFolder) {
    // Chama o método getVideoUrl passando a pasta e o arquivo
    this.selectedVideoUrl = this.videoService.getVideoUrl(this.selectedFolder, fileName);
  } else {
    console.error('Nenhuma pasta selecionada.');
  }
}

  // Função para atualizar o tempo atual do vídeo
  updateCurrentTime(event: Event): void {
    const videoElement = event.target as HTMLVideoElement;
    this.currentTime = videoElement.currentTime;
  }

  cutVideo(): void {
    const start = this.range[0];
    const end = this.range[1];
    const duration = end - start;
  }  

  // Função para atualizar o tempo ao usar o slider
  seekTo(time: number): void {
    const videoElement = this.videoPlayer.nativeElement;
    if (videoElement) {
      videoElement.currentTime = time;
    }
  }

  // Função para abrir o diálogo de corte de vídeo
  abrirDialogoCorte(videoName: string): void {
    this.selectedVideo = videoName;
  }

  loadFolders(): void {
    this.videoService.listFolders().subscribe({
      next: (data: string[]) => {
        this.folders = data;
      },
      error: (err) => {
        console.error('Erro ao carregar as pastas', err);
      }
    });
  }
  // Método para carregar vídeos da pasta selecionada
  onFolderSelected(folderName: string): void {
    this.selectedFolder = folderName;
    this.videoService.listVideosFromFolder(folderName).subscribe({
      next: (data: string[]) => {
        this.videos = data;
      },
      error: (err) => {
        console.error('Erro ao carregar os vídeos', err);
      }
    });
  }

  cortarVideo(): void {
    if (this.selectedVideoUrl && this.selectedFolder) {
      // Extrair o nome do arquivo da URL completa
      const fileName = this.selectedVideoUrl.split('/').pop();
  
      if (!fileName) {
        console.error('Nome do arquivo inválido.');
        return;
      }
  
      const startSeconds = this.range[0];
      const durationSeconds = this.range[1] - this.range[0];
  
      // Chamar o serviço para cortar o vídeo
      this.videoService.cutVideo(this.selectedFolder, fileName, startSeconds, durationSeconds)
        .subscribe(
          response => console.log('Corte realizado com sucesso:', response),
          error => console.error('Erro ao cortar o vídeo:', error)
        );
    } else {
      console.error('Nenhum vídeo ou pasta foi selecionado.');
    }
  }

  toggleLoop(): void {
    const videoElement = this.videoPlayer.nativeElement;
    if (videoElement) {
      videoElement.loop = !videoElement.loop;
    }
  }

playBetween(): void {
  const videoElement = this.videoPlayer.nativeElement;
  if (videoElement) {
    videoElement.currentTime = this.range[0];
    videoElement.play();

    const stopTime = this.range[1];
    const checkTime = () => {
      if (videoElement.currentTime >= stopTime) {
        videoElement.pause();
        videoElement.currentTime = this.range[0];
      } else {
        requestAnimationFrame(checkTime);
      }
    };
    requestAnimationFrame(checkTime);
  }
}

ngAfterViewInit() {
  // O ViewChild só estará disponível após o AfterViewInit
  if (this.videoPlayer) {
    const videoElement = this.videoPlayer.nativeElement;

    // Escutar o evento 'loadedmetadata' para obter a duração correta
    videoElement.addEventListener('loadedmetadata', () => {
      this.videoDuration = videoElement.duration;
      this.sliderOptions.ceil = this.videoDuration;
    });
  }
}
}
