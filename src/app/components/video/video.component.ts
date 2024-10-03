import { Options } from '@angular-slider/ngx-slider';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
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
  selectedVideoUrl: string | null = null;
  videoDuration: number = 100;
  range: number[] = [0, 30];
  sliderOptions = {
    floor: 0,
    ceil: 100
  };
  cutFolders: string[] = [];  // Armazena a lista de subpastas de cortes
  cutVideos: string[] = [];   // Armazena a lista de vídeos dentro da subpasta selecionada
  selectedCutFolder: string | null = null;
  selectedCutVideoUrl: string | null = null;
  selectedFile: File | null = null;
  subFolderName: string = '';
  constructor(private videoService: VideoService, private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.loadFolders();
    this.loadCutFolders();
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
    // Aqui você pode chamar o método de corte e passar os valores de start e duration
  }

  // Função para atualizar o tempo ao usar o slider
  seekTo(time: number): void {
    const videoElement = this.videoPlayer.nativeElement;
    if (videoElement) {
      videoElement.currentTime = time;
    }
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

  onMetadataLoaded(duration: number): void {
    this.videoDuration = duration;
    this.range = [0, duration]; // Define o range máximo do slider com base na duração do vídeo
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

  ngAfterViewInit(): void {
    if (this.videoPlayer) {
      const videoElement = this.videoPlayer.nativeElement;
      videoElement.addEventListener('loadedmetadata', () => {
        this.videoDuration = videoElement.duration;
        this.sliderOptions.ceil = this.videoDuration;
      });
    }
  }

  onCutFolderSelected(folder: string): void {
    this.selectedCutFolder = folder;
    this.videoService.listVideosFromCutFolder(folder).subscribe({
      next: (videos) => this.cutVideos = videos,
      error: (err) => console.error('Erro ao listar vídeos da pasta de corte:', err)
    });
  }

  // Reproduz o vídeo selecionado da pasta de corte
  playCutVideo(video: string): void {
    if (this.selectedCutFolder) {
      // Chama o método getCutVideoUrl do serviço para obter a URL do vídeo cortado
      const videoUrl = this.videoService.getCutVideoUrl(this.selectedCutFolder, video);

      // Usa DomSanitizer para tratar a URL de maneira segura
      this.selectedCutVideoUrl = this.sanitizer.bypassSecurityTrustUrl(videoUrl) as string;
    } else {
      console.error('Nenhuma pasta de corte selecionada.');
    }
  }

  loadCutFolders(): void {
    this.videoService.listCutFolders().subscribe({
      next: (data) => this.cutFolders = data,
      error: (err) => console.error('Erro ao carregar pastas de cortes:', err)
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0]; // Seleciona o arquivo de vídeo
    }
  }

  uploadVideo(): void {
    if (this.selectedFile && this.subFolderName) {
      this.videoService.uploadVideo(this.selectedFile, this.subFolderName).subscribe({
        next: (response) => console.log('Upload realizado com sucesso:', response),
        error: (err) => console.error('Erro ao fazer o upload:', err)
      });
    } else {
      console.error('Nenhum arquivo selecionado ou nome de subpasta inválido.');
    }
  }
}
