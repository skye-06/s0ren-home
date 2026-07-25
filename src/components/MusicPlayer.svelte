<script lang="ts">
	import { onMount } from "svelte";

	type Track = {
		id: string;
		title: string;
		artist: string;
		file: string;
	};

	export let tracks: Track[] = [];

	let audio: HTMLAudioElement;
	let canvas: HTMLCanvasElement;
	let currentIndex = 0;
	let currentTime = 0;
	let duration = 0;
	let expanded = false;
	let playing = false;
	let volume = 0.7;
	let audioContext: AudioContext | undefined;
	let analyser: AnalyserNode | undefined;
	let animationFrame = 0;
	let reducedMotion = false;

	$: currentTrack = tracks[currentIndex] ?? null;

	function formatTime(value: number) {
		if (!Number.isFinite(value)) return "0:00";
		const minutes = Math.floor(value / 60);
		return `${minutes}:${Math.floor(value % 60).toString().padStart(2, "0")}`;
	}

	function remember() {
		if (!currentTrack) return;
		localStorage.setItem(
			"s0ren-music-player",
			JSON.stringify({ trackId: currentTrack.id, volume }),
		);
	}

	function loadTrack(shouldPlay = false) {
		if (!audio || !currentTrack) return;
		audio.src = currentTrack.file;
		audio.load();
		currentTime = 0;
		duration = 0;
		remember();
		if (shouldPlay) void play();
	}

	async function prepareVisualizer() {
		if (!audioContext) {
			audioContext = new AudioContext();
			analyser = audioContext.createAnalyser();
			analyser.fftSize = 64;
			analyser.smoothingTimeConstant = 0.82;
			audioContext.createMediaElementSource(audio).connect(analyser);
			analyser.connect(audioContext.destination);
		}
		if (audioContext.state === "suspended") await audioContext.resume();
	}

	async function play() {
		if (!currentTrack) return;
		try {
			await prepareVisualizer();
			await audio.play();
		} catch {
			playing = false;
		}
	}

	function togglePlay() {
		if (audio.paused) void play();
		else audio.pause();
	}

	function changeTrack(offset: number, shouldPlay = playing) {
		if (!tracks.length) return;
		currentIndex = (currentIndex + offset + tracks.length) % tracks.length;
		loadTrack(shouldPlay);
	}

	function selectTrack(index: number) {
		const shouldPlay = playing;
		currentIndex = index;
		loadTrack(shouldPlay);
	}

	function handleSeek(event: Event) {
		const target = event.currentTarget as HTMLInputElement;
		audio.currentTime = Number(target.value);
		currentTime = audio.currentTime;
	}

	function handleVolume(event: Event) {
		const target = event.currentTarget as HTMLInputElement;
		volume = Number(target.value);
		audio.volume = volume;
		remember();
	}

	function drawVisualizer() {
		cancelAnimationFrame(animationFrame);
		if (!playing || reducedMotion || !canvas || !analyser) return;
		const context = canvas.getContext("2d");
		if (!context) return;
		const rect = canvas.getBoundingClientRect();
		const scale = window.devicePixelRatio || 1;
		const width = Math.max(1, Math.floor(rect.width * scale));
		const height = Math.max(1, Math.floor(rect.height * scale));
		if (canvas.width !== width || canvas.height !== height) {
			canvas.width = width;
			canvas.height = height;
		}
		const data = new Uint8Array(analyser.frequencyBinCount);
		const draw = () => {
			if (!playing) return;
			analyser?.getByteFrequencyData(data);
			context.clearRect(0, 0, width, height);
			const gap = 3 * scale;
			const barWidth = Math.max(2 * scale, (width - gap * (data.length - 1)) / data.length);
			for (let index = 0; index < data.length; index += 1) {
				const barHeight = Math.max(2 * scale, (data[index] / 255) * height * 0.9);
				context.fillStyle = `oklch(0.72 0.14 var(--hue) / ${0.1 + data[index] / 900})`;
				context.beginPath();
				context.roundRect(
					index * (barWidth + gap),
					height - barHeight,
					barWidth,
					barHeight,
					barWidth / 2,
				);
				context.fill();
			}
			animationFrame = requestAnimationFrame(draw);
		};
		draw();
	}

	onMount(() => {
		reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		try {
			const saved = JSON.parse(localStorage.getItem("s0ren-music-player") || "{}");
			const savedIndex = tracks.findIndex((track) => track.id === saved.trackId);
			if (savedIndex >= 0) currentIndex = savedIndex;
			if (Number.isFinite(saved.volume)) volume = Math.min(1, Math.max(0, saved.volume));
		} catch {
			// 无效的本地状态不影响播放
		}
		audio.volume = volume;
		loadTrack();
		return () => {
			cancelAnimationFrame(animationFrame);
			void audioContext?.close();
		};
	});
</script>

<aside class:expanded class:playing class="music-player" aria-label="背景音乐播放器">
	<canvas bind:this={canvas} class="visualizer" aria-hidden="true"></canvas>
	<div class="player-row">
		<button
			class="track-summary"
			type="button"
			aria-expanded={expanded}
			aria-controls="music-player-panel"
			on:click={() => (expanded = !expanded)}
		>
			<span class="wave-mark" aria-hidden="true">
				<i></i><i></i><i></i><i></i>
			</span>
			<span class="track-copy">
				<strong>{currentTrack?.title || "音乐库暂无歌曲"}</strong>
				<small>{currentTrack?.artist || "可在内容编辑器中上传"}</small>
			</span>
		</button>
		<div class="quick-controls">
			<button type="button" aria-label="上一首" disabled={!currentTrack} on:click={() => changeTrack(-1)}>
				<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h2v14H6zm3 7 9-7v14z" /></svg>
			</button>
			<button
				class="play-button"
				type="button"
				aria-label={playing ? "暂停" : "播放"}
				disabled={!currentTrack}
				on:click={togglePlay}
			>
				{#if playing}
					<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h4v14H7zm6 0h4v14h-4z" /></svg>
				{:else}
					<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7z" /></svg>
				{/if}
			</button>
			<button type="button" aria-label="下一首" disabled={!currentTrack} on:click={() => changeTrack(1)}>
				<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 5h2v14h-2zM6 5l9 7-9 7z" /></svg>
			</button>
		</div>
	</div>

	<div id="music-player-panel" class="player-panel" hidden={!expanded}>
		<div class="progress-row">
			<span>{formatTime(currentTime)}</span>
			<input
				type="range"
				min="0"
				max={duration || 0}
				step="0.1"
				value={currentTime}
				aria-label="播放进度"
				disabled={!currentTrack}
				on:input={handleSeek}
			/>
			<span>{formatTime(duration)}</span>
		</div>
		<label class="volume-row">
			<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9zm11.5-.5v7a4 4 0 0 0 0-7zm0-4v2.1a6 6 0 0 1 0 10.8v2.1a8 8 0 0 0 0-15z" /></svg>
			<span>音量</span>
			<input type="range" min="0" max="1" step="0.05" value={volume} aria-label="音量" on:input={handleVolume} />
		</label>
		{#if tracks.length}
			<div class="playlist" aria-label="歌曲列表">
				{#each tracks as track, index}
					<button
						type="button"
						class:active={index === currentIndex}
						aria-current={index === currentIndex ? "true" : undefined}
						on:click={() => selectTrack(index)}
					>
						<span>{track.title}</span>
						<small>{track.artist}</small>
					</button>
				{/each}
			</div>
		{/if}
	</div>
	<audio
		bind:this={audio}
		preload="metadata"
		on:play={() => {
			playing = true;
			drawVisualizer();
		}}
		on:pause={() => (playing = false)}
		on:timeupdate={() => (currentTime = audio.currentTime)}
		on:loadedmetadata={() => (duration = audio.duration)}
		on:ended={() => changeTrack(1, true)}
	></audio>
</aside>

<style>
	.music-player {
		position: fixed;
		z-index: 45;
		top: 5.5rem;
		left: 1rem;
		width: min(20rem, calc(100vw - 2rem));
		overflow: hidden;
		border: 1px solid var(--line-divider);
		border-radius: var(--radius-large);
		background: color-mix(in oklch, var(--card-bg) 78%, transparent);
		box-shadow: 0 14px 40px rgb(28 25 55 / 12%);
		backdrop-filter: blur(18px) saturate(145%);
		transition:
			width 220ms ease,
			background-color 220ms ease,
			box-shadow 220ms ease;
	}

	.music-player:not(.expanded) {
		width: min(18rem, calc(100vw - 2rem));
	}

	.visualizer {
		position: absolute;
		inset: auto 0 0;
		width: 100%;
		height: 56%;
		opacity: 0;
		pointer-events: none;
		transition: opacity 240ms ease;
	}

	.playing .visualizer {
		opacity: 1;
	}

	.player-row {
		position: relative;
		display: flex;
		align-items: center;
		gap: 0.25rem;
		min-height: 4rem;
		padding: 0.45rem;
	}

	button {
		border: 0;
		color: inherit;
		font: inherit;
	}

	button:focus-visible,
	input:focus-visible {
		outline: 2px solid var(--primary);
		outline-offset: 2px;
	}

	.track-summary {
		display: flex;
		flex: 1;
		align-items: center;
		gap: 0.65rem;
		min-width: 0;
		padding: 0.45rem;
		border-radius: 0.75rem;
		background: transparent;
		text-align: left;
		cursor: pointer;
	}

	.track-summary:hover {
		background: var(--btn-plain-bg-hover);
	}

	.wave-mark {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 2px;
		flex: 0 0 2.25rem;
		width: 2.25rem;
		height: 2.25rem;
		border-radius: 0.7rem;
		background: var(--btn-regular-bg);
		color: var(--primary);
	}

	.wave-mark i {
		width: 3px;
		height: 0.55rem;
		border-radius: 999px;
		background: currentColor;
		animation: wave 900ms ease-in-out infinite alternate;
	}

	.wave-mark i:nth-child(2) {
		height: 1.05rem;
		animation-delay: -420ms;
	}

	.wave-mark i:nth-child(3) {
		height: 0.8rem;
		animation-delay: -180ms;
	}

	.wave-mark i:nth-child(4) {
		height: 0.45rem;
		animation-delay: -620ms;
	}

	.music-player:not(.playing) .wave-mark i {
		animation-play-state: paused;
	}

	.track-copy {
		display: block;
		min-width: 0;
	}

	.track-copy strong,
	.track-copy small {
		display: block;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.track-copy strong {
		color: rgb(0 0 0 / 78%);
		font-size: 0.84rem;
		font-weight: 700;
	}

	:global(.dark) .track-copy strong {
		color: rgb(255 255 255 / 84%);
	}

	.track-copy small {
		margin-top: 0.18rem;
		color: rgb(0 0 0 / 45%);
		font-size: 0.7rem;
	}

	:global(.dark) .track-copy small {
		color: rgb(255 255 255 / 48%);
	}

	.quick-controls {
		display: flex;
		flex: 0 0 auto;
		align-items: center;
	}

	.quick-controls button {
		display: grid;
		place-items: center;
		width: 2rem;
		height: 2rem;
		border-radius: 0.65rem;
		background: transparent;
		cursor: pointer;
	}

	.quick-controls button:hover {
		background: var(--btn-plain-bg-hover);
		color: var(--primary);
	}

	.quick-controls button:disabled {
		cursor: default;
		opacity: 0.28;
	}

	.quick-controls .play-button {
		background: var(--btn-regular-bg);
		color: var(--primary);
	}

	svg {
		width: 1.1rem;
		height: 1.1rem;
		fill: currentColor;
	}

	.player-panel {
		position: relative;
		padding: 0 0.8rem 0.8rem;
		border-top: 1px solid var(--line-divider);
	}

	.progress-row,
	.volume-row {
		display: grid;
		align-items: center;
		gap: 0.55rem;
		padding-top: 0.75rem;
		color: rgb(0 0 0 / 48%);
		font-size: 0.68rem;
	}

	:global(.dark) .progress-row,
	:global(.dark) .volume-row {
		color: rgb(255 255 255 / 52%);
	}

	.progress-row {
		grid-template-columns: 2.35rem 1fr 2.35rem;
	}

	.progress-row span:last-child {
		text-align: right;
	}

	.volume-row {
		grid-template-columns: 1.1rem 2rem 1fr;
	}

	input[type="range"] {
		width: 100%;
		height: 3px;
		accent-color: var(--primary);
		cursor: pointer;
	}

	.playlist {
		display: grid;
		gap: 0.25rem;
		max-height: 12rem;
		margin-top: 0.75rem;
		overflow-y: auto;
	}

	.playlist button {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 0.75rem;
		width: 100%;
		padding: 0.55rem 0.65rem;
		border-radius: 0.65rem;
		background: transparent;
		color: rgb(0 0 0 / 68%);
		text-align: left;
		cursor: pointer;
	}

	:global(.dark) .playlist button {
		color: rgb(255 255 255 / 72%);
	}

	.playlist button:hover,
	.playlist button.active {
		background: var(--btn-plain-bg-hover);
		color: var(--primary);
	}

	.playlist span,
	.playlist small {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.playlist small {
		color: currentColor;
		opacity: 0.62;
	}

	@keyframes wave {
		to {
			transform: scaleY(0.45);
		}
	}

	@media (max-width: 640px) {
		.music-player,
		.music-player:not(.expanded) {
			top: 4.85rem;
			left: 0.75rem;
			width: calc(100vw - 1.5rem);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.wave-mark i {
			animation: none;
		}
	}
</style>
