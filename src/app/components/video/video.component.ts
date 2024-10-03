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
  
  videos: string[] = []; 
  selectedVideo: string | null = null; 
  currentTime: number = 0;
  folders: string[] = []; 
  selectedFolder: string | null = null;
  isLooping: boolean = false; 
  cutSliderOptions: Options = { floor: 0, ceil: 100, step: 0.1 }; 
  endTime: number = 0;
  selectedVideoUrl: string | null = null;
  videoDuration: number = 100;
  range: number[] = [0, 30]; 
  sliderOptions = { floor: 0, ceil: 100 };
  cutFolders: string[] = []; 
  cutVideos: string[] = [];
  selectedCutFolder: string | null = null;
  selectedCutVideoUrl: string | null = null;
  selectedFile: File | null = null;
  subFolderName: string = ''; 
  isCutting = false;
  cutProgress = 0; 
  cutSuccessMessage: string | null = null;
  loopMessage: string = 'Loop desativado'; 
  uploadSuccessMessage: string = '';
  private progressSubscription!: Subscription;
  private loopListener: any; 

  constructor(private videoService: VideoService, private sanitizer: DomSanitizer,private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.loadFolders(); 
    this.loadCutFolders(); 
  }

  playVideo(fileName: string): void {
    if (this.selectedFolder) {
      this.selectedVideoUrl = this.videoService.getVideoUrl(this.selectedFolder, fileName);
    } else {
      console.error('Nenhuma pasta selecionada.');
    }
  }

  updateCurrentTime(event: Event): void {
    const videoElement = event.target as HTMLVideoElement;
    this.currentTime = videoElement.currentTime;
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
      this.isCutting = true;
      this.cutProgress = 0;
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

  trackCutProgress(folderName: string, fileName: string): void {
    this.progressSubscription = interval(2000).subscribe(() => {
      this.videoService.getCutProgress(folderName, fileName).subscribe({
        next: (progress: number) => {
          this.cutProgress = progress * 100;
          if (progress >= 1) {
            console.log('Corte concluído!');
            this.isCutting = false;
            this.cutSuccessMessage = 'Corte feito com sucesso!'; 
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

  toggleLoop(): void {
    const videoElement = this.videoPlayer.nativeElement;
    if (videoElement) {
      this.isLooping = !this.isLooping; 
      if (this.isLooping) {
        this.loopMessage = 'Loop acionado';
        videoElement.currentTime = this.range[0];
        videoElement.play();
        this.loopListener = () => {
          if (videoElement.currentTime >= this.range[1]) {
            videoElement.currentTime = this.range[0];
          }
        };
        videoElement.addEventListener('timeupdate', this.loopListener);
      } else {
        this.loopMessage = 'Loop desativado';
        if (this.loopListener) {
          videoElement.removeEventListener('timeupdate', this.loopListener);
          this.loopListener = null;
        }
      }
    }
  }

  onMetadataLoaded(duration: number): void {
    this.videoDuration = duration;
    this.range = [0, duration];
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

  onCutFolderSelected(folder: string): void {
    this.selectedCutFolder = folder;
    this.videoService.listVideosFromCutFolder(folder).subscribe({
      next: (videos) => this.cutVideos = videos,
      error: (err) => console.error('Erro ao listar vídeos da pasta de corte:', err)
    });
  }

  playCutVideo(video: string): void {
    if (this.selectedCutFolder) {
      const videoUrl = this.videoService.getCutVideoUrl(this.selectedCutFolder, video);
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
      this.selectedFile = input.files[0];
    }
  }

  uploadVideo(): void {
    if (this.selectedFile && this.subFolderName) {
      this.videoService.uploadVideo(this.selectedFile, this.subFolderName).subscribe({
        next: (response) => {
          console.log('Upload realizado com sucesso:', response);
                    this.uploadSuccessMessage = 'Vídeo enviado com sucesso!';
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
