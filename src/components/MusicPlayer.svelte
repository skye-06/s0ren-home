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
	const visualBarCount = 20;
	const visualLevels = new Float32Array(visualBarCount);

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
		const primary =
			getComputedStyle(document.documentElement).getPropertyValue("--primary").trim() ||
			"#7c72e8";
		const draw = () => {
			if (!playing) return;
			analyser?.getByteFrequencyData(data);
			context.clearRect(0, 0, width, height);
			const gap = 4 * scale;
			const barWidth = Math.max(
				2 * scale,
				(width - gap * (visualBarCount - 1)) / visualBarCount,
			);
			context.fillStyle = primary;
			for (let index = 0; index < visualBarCount; index += 1) {
				const distance = Math.abs(index - (visualBarCount - 1) / 2) / (visualBarCount / 2);
				const source = Math.min(data.length - 1, Math.floor(distance ** 1.6 * data.length));
				const target = 0.12 + Math.sqrt(data[source] / 255) * 0.72;
				visualLevels[index] += (target - visualLevels[index]) * 0.16;
				const barHeight = Math.max(3 * scale, visualLevels[index] * height);
				context.globalAlpha = 0.1 + visualLevels[index] * 0.2;
				context.beginPath();
				context.roundRect(
					index * (barWidth + gap),
					(height - barHeight) / 2,
					barWidth,
					barHeight,
					barWidth / 2,
				);
				context.fill();
			}
			context.globalAlpha = 1;
			animationFrame = requestAnimationFrame(draw);
		};
		draw();
	}

	onMount(() => {
		if (!audio) return;
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

{#if tracks.length}
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
				<i></i><i></i><i></i><i></i><i></i>
			</span>
			<span class="track-copy" aria-live="polite">
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
		<div class="panel-heading">
			<span>播放队列</span>
			<span>{currentIndex + 1} / {tracks.length}</span>
		</div>
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
{/if}

<style>
	.music-player {
		position: fixed;
		z-index: 45;
		top: 5.5rem;
		left: max(1rem, calc((100vw - var(--page-width)) / 2 + 1rem));
		width: min(22rem, calc(100vw - 2rem));
		overflow: hidden;
		border: 1px solid var(--line-divider);
		border-radius: var(--radius-large);
		background: color-mix(in oklch, var(--float-panel-bg) 86%, transparent);
		box-shadow:
			0 18px 50px rgb(28 25 55 / 12%),
			inset 0 1px rgb(255 255 255 / 24%);
		backdrop-filter: blur(22px) saturate(135%);
		transition:
			width 220ms ease,
			transform 220ms ease,
			background-color 220ms ease,
			box-shadow 220ms ease;
	}

	.music-player:not(.expanded) {
		width: min(21rem, calc(100vw - 2rem));
	}

	.music-player:hover {
		transform: translateY(-2px);
		box-shadow:
			0 22px 58px rgb(28 25 55 / 16%),
			inset 0 1px rgb(255 255 255 / 28%);
	}

	.visualizer {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		opacity: 0;
		mask-image: linear-gradient(to right, transparent 2%, black 22%, black 78%, transparent 98%);
		pointer-events: none;
		transition: opacity 320ms ease;
	}

	.playing .visualizer {
		opacity: 0.72;
	}

	.player-row {
		position: relative;
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		align-items: center;
		gap: 0.45rem;
		min-height: 4.35rem;
		padding: 0.5rem;
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
		display: grid;
		grid-template-columns: 2.5rem minmax(0, 1fr);
		align-items: center;
		gap: 0.65rem;
		min-width: 0;
		padding: 0.4rem;
		border-radius: 0.8rem;
		background: color-mix(in oklch, var(--card-bg) 24%, transparent);
		text-align: left;
		cursor: pointer;
		transition:
			background-color 180ms ease,
			transform 180ms ease;
	}

	.track-summary:hover {
		background: var(--btn-plain-bg-hover);
		transform: translateX(2px);
	}

	.wave-mark {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 2.5px;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 0.8rem;
		background: color-mix(in oklch, var(--btn-regular-bg) 84%, transparent);
		color: var(--primary);
		box-shadow: inset 0 0 0 1px color-mix(in oklch, var(--primary) 12%, transparent);
	}

	.wave-mark i {
		width: 2.5px;
		height: 1rem;
		border-radius: 999px;
		background: currentColor;
		transform: scaleY(0.32);
		transform-origin: center;
		animation: wave 900ms cubic-bezier(0.45, 0, 0.55, 1) infinite;
	}

	.wave-mark i:nth-child(2) {
		animation-delay: -180ms;
	}

	.wave-mark i:nth-child(3) {
		animation-delay: -360ms;
	}

	.wave-mark i:nth-child(4) {
		animation-delay: -540ms;
	}

	.wave-mark i:nth-child(5) {
		animation-delay: -720ms;
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
		font-size: 0.82rem;
		font-weight: 700;
		letter-spacing: 0.01em;
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
		gap: 0.1rem;
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
		border-radius: 999px;
		transform: scale(1.08);
	}

	svg {
		width: 1.1rem;
		height: 1.1rem;
		fill: currentColor;
	}

	.player-panel {
		position: relative;
		padding: 0 0.9rem 0.9rem;
		border-top: 1px solid var(--line-divider);
		background: color-mix(in oklch, var(--card-bg) 24%, transparent);
	}

	.panel-heading {
		display: flex;
		justify-content: space-between;
		padding-top: 0.75rem;
		color: rgb(0 0 0 / 42%);
		font-size: 0.66rem;
		font-weight: 700;
		letter-spacing: 0.08em;
	}

	:global(.dark) .panel-heading {
		color: rgb(255 255 255 / 46%);
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

	.playlist button.active {
		box-shadow: inset 2px 0 var(--primary);
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
		0%,
		100% {
			transform: scaleY(0.32);
			opacity: 0.52;
		}
		50% {
			transform: scaleY(1);
			opacity: 1;
		}
	}

	@media (max-width: 640px) {
		.music-player,
		.music-player:not(.expanded) {
			top: 4.75rem;
			bottom: auto;
			left: 0.75rem;
			width: calc(100vw - 1.5rem);
		}

		.music-player:hover {
			transform: none;
		}

		.playlist {
			max-height: min(12rem, 32vh);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.wave-mark i {
			animation: none;
		}
	}
</style>
