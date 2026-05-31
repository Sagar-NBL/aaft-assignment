'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Maximize,
  Minimize,
  Pause,
  PictureInPicture,
  Play,
  SkipBack,
  SkipForward,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateVideoProgressThunk } from '@/store/thunks/progressThunks';
import { setVideoProgressLocal } from '@/store/slices/progressSlice';
import {
  detectVideoProvider,
  getVimeoId,
  getYouTubeId,
  mergeWatchedSegments,
  segmentsToPercentage,
} from '@/utils/video';
import { cn, formatDuration } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { VideoProgress } from '@/types';

type LessonLike = {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  duration: number;
};

type Props = {
  lesson: LessonLike;
  courseId: string;
  onNext?: () => void;
  onPrev?: () => void;
  initialProgress?: VideoProgress;
};

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export function VideoPlayer({ lesson, courseId, onNext, onPrev, initialProgress }: Props) {
  const dispatch = useAppDispatch();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(lesson.duration);
  const [speed, setSpeed] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [segments, setSegments] = useState<[number, number][]>(
    initialProgress?.watchedSegments ?? [[0, initialProgress?.lastWatched ?? 0]]
  );
  const provider = detectVideoProvider(lesson.videoUrl);
  const stored = useAppSelector((s) => s.progress.videoProgress[lesson.id]);

  useEffect(() => {
    const savedTime = typeof window !== 'undefined' ? localStorage.getItem(`video-progress-${lesson.id}`) : null;
    const timeToSet = savedTime ? parseFloat(savedTime) : initialProgress?.lastWatched;

    if (timeToSet && videoRef.current && provider === 'mp4') {
      videoRef.current.currentTime = timeToSet;
      setCurrentTime(timeToSet);
    }
    if (initialProgress?.watchedSegments) setSegments(initialProgress.watchedSegments);
  }, [initialProgress, lesson.id, provider]);

  const persistProgress = useCallback(
    (time: number, dur: number, segs: [number, number][]) => {
      const pct = segmentsToPercentage(segs, dur);
      const isCompleted = pct >= 90;
      const progress: VideoProgress = {
        lastWatched: time,
        percentage: pct,
        isCompleted,
        watchedSegments: segs,
        totalWatchTime: stored?.totalWatchTime,
      };
      dispatch(setVideoProgressLocal({ videoId: lesson.id, progress }));
      dispatch(
        updateVideoProgressThunk({
          videoId: lesson.id,
          courseId,
          lastWatched: time,
          percentage: pct,
          duration: dur,
          watchedSegments: segs,
        })
      );
    },
    [courseId, dispatch, lesson.id, stored?.totalWatchTime]
  );

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v) return;
    const t = v.currentTime;
    setCurrentTime(t);
    const newSegs = mergeWatchedSegments(segments, Math.max(0, t - 2), t);
    setSegments(newSegs);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(`video-progress-${lesson.id}`, t.toString());
    }

    if (Math.floor(t) % 3 === 0) {
      persistProgress(t, v.duration || duration, newSegs);
    }
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    if (!v || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    v.currentTime = ratio * duration;
    setCurrentTime(v.currentTime);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`video-progress-${lesson.id}`, v.currentTime.toString());
    }
  };

  const renderEmbed = () => {
    const savedTime = typeof window !== 'undefined' ? localStorage.getItem(`video-progress-${lesson.id}`) : null;
    const startProgress = savedTime ? Math.floor(parseFloat(savedTime)) : Math.floor(initialProgress?.lastWatched ?? 0);

    if (provider === 'youtube') {
      const id = getYouTubeId(lesson.videoUrl);
      return (
        <iframe
          title={lesson.title}
          className="aspect-video w-full"
          src={`https://www.youtube.com/embed/${id}?start=${startProgress}&enablejsapi=1`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      );
    }
    if (provider === 'vimeo') {
      const id = getVimeoId(lesson.videoUrl);
      return (
        <iframe
          title={lesson.title}
          className="aspect-video w-full"
          src={`https://player.vimeo.com/video/${id}#t=${startProgress}s`}
          allow="fullscreen; picture-in-picture"
          allowFullScreen
        />
      );
    }
    return (
      <video
        ref={videoRef}
        src={lesson.videoUrl}
        className="aspect-video w-full bg-black"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => {
          if (videoRef.current) {
            setDuration(videoRef.current.duration);
            const savedTime = typeof window !== 'undefined' ? localStorage.getItem(`video-progress-${lesson.id}`) : null;
            const timeToSet = savedTime ? parseFloat(savedTime) : initialProgress?.lastWatched;
            if (timeToSet) {
              videoRef.current.currentTime = timeToSet;
            }
          }
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        playsInline
      />
    );
  };

  const segmentPercent = (start: number, end: number) => ({
    left: `${(start / duration) * 100}%`,
    width: `${((end - start) / duration) * 100}%`,
  });

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-2xl bg-black shadow-2xl"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {renderEmbed()}
      {provider === 'mp4' && (
        <div
          className={cn(
            'absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-4 transition-opacity',
            showControls ? 'opacity-100' : 'opacity-0'
          )}
        >
          <div
            className="relative mb-3 h-2 cursor-pointer rounded-full bg-white/20"
            onClick={seek}
            role="slider"
            aria-label="Video progress"
            aria-valuemin={0}
            aria-valuemax={duration}
            aria-valuenow={currentTime}
          >
            {segments.map(([s, e], i) => (
              <div
                key={i}
                className="absolute top-0 h-full rounded-full bg-[rgb(var(--gold))]/60"
                style={segmentPercent(s, e)}
              />
            ))}
            <div
              className="absolute top-0 h-full rounded-full bg-[rgb(var(--gold))]"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="icon" variant="ghost" className="text-white" onClick={onPrev} disabled={!onPrev} aria-label="Previous lesson">
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" className="text-white" onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}>
              {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>
            <Button size="icon" variant="ghost" className="text-white" onClick={onNext} disabled={!onNext} aria-label="Next lesson">
              <SkipForward className="h-4 w-4" />
            </Button>
            <span className="text-xs text-white/80 ml-2">
              {formatDuration(currentTime)} / {formatDuration(duration)}
            </span>
            <select
              className="ml-auto rounded bg-white/10 px-2 py-1 text-xs text-white"
              value={speed}
              onChange={(e) => {
                const s = Number(e.target.value);
                setSpeed(s);
                if (videoRef.current) videoRef.current.playbackRate = s;
              }}
              aria-label="Playback speed"
            >
              {SPEEDS.map((s) => (
                <option key={s} value={s}>{s}x</option>
              ))}
            </select>
            <Button
              size="icon"
              variant="ghost"
              className="text-white"
              onClick={() => videoRef.current?.requestPictureInPicture()}
              aria-label="Picture in picture"
            >
              <PictureInPicture className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="text-white"
              onClick={() => {
                if (document.fullscreenElement) document.exitFullscreen();
                else containerRef.current?.requestFullscreen();
              }}
              aria-label="Fullscreen"
            >
              {document.fullscreenElement ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
