import { Options } from '@angular-slider/ngx-slider';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DomSanitizer } from '@angular/platform-browser';
import { interval, Subscription } from 'rxjs';
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
  folders: string[] = []; // Lista de pastas com vídeos
  selectedFolder: string | null = null; // Pasta selecionada
  isLooping: boolean = false; // Controle de loop
  cutSliderOptions: Options = { floor: 0, ceil: 100, step: 0.1 }; // Opções do slider de corte
  endTime: number = 0;
  selectedVideoUrl: string | null = null;
  videoDuration: number = 100; // Duração do vídeo
  range: number[] = [0, 30]; // Definição de intervalo de corte
  sliderOptions = { floor: 0, ceil: 100 };
  cutFolders: string[] = []; // Lista de subpastas de cortes
  cutVideos: string[] = []; // Lista de vídeos dentro da subpasta selecionada
  selectedCutFolder: string | null = null;
  selectedCutVideoUrl: string | null = null;
  selectedFile: File | null = null; // Arquivo de vídeo selecionado
  subFolderName: string = ''; // Nome da subpasta
  isCutting = false; // Indica se o vídeo está sendo cortado
  cutProgress = 0; // Progresso do corte
  cutSuccessMessage: string | null = null; // Variável para armazenar a mensagem de sucesso
  loopMessage: string = 'Loop desativado'; // Mensagem inicial
  uploadSuccessMessage: string = '';
  private progressSubscription!: Subscription;
  private loopListener: any; // Referência para o listener do loop

  constructor(private videoService: VideoService, private sanitizer: DomSanitizer,private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.loadFolders(); // Carrega pastas com vídeos
    this.loadCutFolders(); // Carrega pastas com vídeos cortados
  }

  playVideo(fileName: string): void {
    if (this.selectedFolder) {
      this.selectedVideoUrl = this.videoService.getVideoUrl(this.selectedFolder, fileName);
    } else {
      console.error('Nenhuma pasta selecionada.');
    }
  }

  // Atualiza o tempo atual do vídeo durante a reprodução
  updateCurrentTime(event: Event): void {
    const videoElement = event.target as HTMLVideoElement;
    this.currentTime = videoElement.currentTime;
  }

  // Função para cortar o vídeo com base no intervalo definido
  cortarVideo(): void {
    if (this.selectedVideoUrl && this.selectedFolder) {
      const fileName = this.selectedVideoUrl.split('/').pop();
  
      if (!fileName) {
        console.error('Nome do arquivo inválido.');
        return;
      }
  
      const startSeconds = this.range[0];
      const durationSeconds = this.range[1] - this.range[0];
  
      this.isCutting = true;
      this.cutProgress = 0;
  
      // Utilizando o operador de coalescência nula (??) para garantir uma string válida
      const folderName = this.selectedFolder ?? '';
  
      this.videoService.cutVideo(folderName, fileName, startSeconds, durationSeconds)
        .subscribe({
          next: () => {
            console.log('Corte iniciado com sucesso');
            this.trackCutProgress(folderName, fileName);
          },
          error: (err) => {
            console.error('Erro ao iniciar o corte do vídeo:', err);
            this.isCutting = false;
          }
        });
    } else {
      console.error('Nenhum vídeo ou pasta foi selecionado.');
    }
  }


  // Função para monitorar o progresso do corte
  trackCutProgress(folderName: string, fileName: string): void {
    this.progressSubscription = interval(2000).subscribe(() => {
      this.videoService.getCutProgress(folderName, fileName).subscribe({
        next: (progress: number) => {
          this.cutProgress = progress * 100;
          if (progress >= 1) {
            console.log('Corte concluído!');
            this.isCutting = false;
            this.cutSuccessMessage = 'Corte feito com sucesso!'; // Define a mensagem de sucesso
            this.progressSubscription.unsubscribe();
          }
        },
        error: (err) => {
          console.error('Erro ao monitorar o progresso do corte:', err);
          this.isCutting = false;
          this.progressSubscription.unsubscribe();
        }
      });
    });
  }

  // Função para ativar/desativar o loop
  toggleLoop(): void {
    const videoElement = this.videoPlayer.nativeElement;
    if (videoElement) {
      this.isLooping = !this.isLooping; // Alterna o estado do loop
  
      if (this.isLooping) {
        // Loop ativado
        this.loopMessage = 'Loop acionado';
  
        // Inicia a reprodução do vídeo a partir do início do intervalo
        videoElement.currentTime = this.range[0];
        videoElement.play();
  
        // Adiciona um listener para monitorar o tempo de reprodução
        this.loopListener = () => {
          if (videoElement.currentTime >= this.range[1]) {
            videoElement.currentTime = this.range[0];
          }
        };
        videoElement.addEventListener('timeupdate', this.loopListener);
      } else {
        // Loop desativado
        this.loopMessage = 'Loop desativado';
  
        // Remove o listener do loop
        if (this.loopListener) {
          videoElement.removeEventListener('timeupdate', this.loopListener);
          this.loopListener = null;
        }
      }
    }
  }

  // Carrega os metadados do vídeo (como a duração) quando ele é carregado
  onMetadataLoaded(duration: number): void {
    this.videoDuration = duration;
    this.range = [0, duration]; // Define o intervalo máximo do slider com base na duração do vídeo
  }

  // Reproduz um trecho do vídeo com base no intervalo definido
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

  // Carrega a lista de pastas disponíveis
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

  // Carrega os vídeos da pasta selecionada
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

  // Seleciona uma subpasta de cortes e carrega os vídeos dentro dela
  onCutFolderSelected(folder: string): void {
    this.selectedCutFolder = folder;
    this.videoService.listVideosFromCutFolder(folder).subscribe({
      next: (videos) => this.cutVideos = videos,
      error: (err) => console.error('Erro ao listar vídeos da pasta de corte:', err)
    });
  }

  // Reproduz o vídeo cortado selecionado
  playCutVideo(video: string): void {
    if (this.selectedCutFolder) {
      const videoUrl = this.videoService.getCutVideoUrl(this.selectedCutFolder, video);
      this.selectedCutVideoUrl = this.sanitizer.bypassSecurityTrustUrl(videoUrl) as string;
    } else {
      console.error('Nenhuma pasta de corte selecionada.');
    }
  }

  // Carrega a lista de subpastas de cortes
  loadCutFolders(): void {
    this.videoService.listCutFolders().subscribe({
      next: (data) => this.cutFolders = data,
      error: (err) => console.error('Erro ao carregar pastas de cortes:', err)
    });
  }

  // Função para selecionar o arquivo de vídeo a ser enviado
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  // Faz o upload do vídeo para o servidor
  uploadVideo(): void {
    if (this.selectedFile && this.subFolderName) {
      this.videoService.uploadVideo(this.selectedFile, this.subFolderName).subscribe({
        next: (response) => {
          console.log('Upload realizado com sucesso:', response);
          
          // Exibe a mensagem de sucesso
          this.uploadSuccessMessage = 'Vídeo enviado com sucesso!';
          
          // Opcional: Limpa o estado de seleção de arquivo e subpasta após o upload
          this.selectedFile = null;
          this.subFolderName = '';
        },
        error: (err) => {
          console.error('Erro ao fazer o upload:', err);
        }
      });
    } else {
      console.error('Nenhum arquivo selecionado ou nome de subpasta inválido.');
    }
  }

  // Configurações e ajustes quando o componente for carregado
  ngAfterViewInit(): void {
    if (this.videoPlayer) {
      const videoElement = this.videoPlayer.nativeElement;
      videoElement.addEventListener('loadedmetadata', () => {
        this.videoDuration = videoElement.duration;
        this.sliderOptions.ceil = this.videoDuration;
      });
    }
  }

  seekTo(time: number): void {
    const videoElement = this.videoPlayer.nativeElement;
    if (videoElement) {
      videoElement.currentTime = time;
    }
  }

}
