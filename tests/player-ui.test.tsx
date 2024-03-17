import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { PlayerBar } from '@/components/player/PlayerBar';
import { TrackCard } from '@/components/track/TrackCard';
import { LibraryProvider } from '@/contexts/LibraryContext';
import { PlayerProvider } from '@/contexts/PlayerContext';
import { buildCatalogue } from '@/lib/catalogue/fixture/seed';

const catalogue = buildCatalogue();
const track = catalogue.tracks[0];

beforeAll(() => {
  // jsdom implements no media pipeline, so these are stubs rather than mocks of
  // behaviour: the assertions below are about our own state, not the element's.
  Object.defineProperty(window.HTMLMediaElement.prototype, 'play', {
    configurable: true,
    value: vi.fn().mockResolvedValue(undefined)
  });
  Object.defineProperty(window.HTMLMediaElement.prototype, 'pause', {
    configurable: true,
    value: vi.fn()
  });
  Object.defineProperty(window.HTMLMediaElement.prototype, 'load', {
    configurable: true,
    value: vi.fn()
  });
});

function renderApp() {
  return render(
    <LibraryProvider>
      <PlayerProvider>
        <TrackCard track={track} context={catalogue.tracks.slice(0, 3)} />
        <PlayerBar />
      </PlayerProvider>
    </LibraryProvider>
  );
}

describe('TrackCard', () => {
  it('shows the title, artist and duration', async () => {
    renderApp();
    expect(await screen.findByRole('heading', { name: track.title })).toBeInTheDocument();
    expect(screen.getAllByText(track.artist).length).toBeGreaterThan(0);
  });

  it('loads the track into the player bar when played', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole('button', { name: `Play ${track.title}` }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Pause' })).toBeEnabled();
    });
    expect(screen.getByRole('slider', { name: 'Seek' })).toBeEnabled();
  });

  it('adds and removes the track from the library', async () => {
    const user = userEvent.setup();
    renderApp();

    const save = await screen.findByRole('button', {
      name: `Save ${track.title} to your library`
    });
    await user.click(save);

    const remove = await screen.findByRole('button', {
      name: `Remove ${track.title} from your library`
    });
    await user.click(remove);

    expect(
      await screen.findByRole('button', { name: `Save ${track.title} to your library` })
    ).toBeInTheDocument();
  });
});

describe('PlayerBar', () => {
  it('starts empty with the transport disabled', async () => {
    renderApp();
    expect(await screen.findByText('Nothing queued yet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Play' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next track' })).toBeDisabled();
  });

  it('cycles the repeat mode', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole('button', { name: 'Repeat: off' }));
    expect(await screen.findByRole('button', { name: 'Repeat: all' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Repeat: all' }));
    expect(await screen.findByRole('button', { name: 'Repeat: one' })).toBeInTheDocument();
  });

  it('mutes and restores the volume', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole('button', { name: 'Mute' }));
    const volume = screen.getByRole('slider', { name: 'Volume' }) as HTMLInputElement;
    expect(volume.value).toBe('0');

    await user.click(screen.getByRole('button', { name: 'Unmute' }));
    expect((screen.getByRole('slider', { name: 'Volume' }) as HTMLInputElement).value).toBe('0.7');
  });
});
