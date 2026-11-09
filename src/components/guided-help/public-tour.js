// Routing is owned by the tour so Next/Back can cross pages without ending it.
export function createPublicTour({ driver, plan, navigate, readRoute, findTarget, waitForTarget, onStop, onError }) {
    const origin = readRoute();
    let expectedRoute = origin;
    let active = true;
    let moving = false;
    let index = 0;
    let generation = 0;
    let tour;

    function buttons(busy) {
        const popover = tour?.getState()?.popover;
        if (!popover) return;
        popover.nextButton.disabled = busy;
        popover.previousButton.disabled = busy || index === 0;
        popover.nextButton.setAttribute('aria-busy', String(busy));
    }

    function stop(restore = true) {
        if (!active) return;
        active = false;
        moving = false;
        generation++;
        tour.destroy();
        if (restore && readRoute() !== origin) navigate(origin, { replace: true });
        onStop?.(restore);
    }

    async function show(next, direction = 1) {
        if (!active || moving) return;
        moving = true;
        buttons(true);
        const request = ++generation;
        try {
            for (let candidate = next; candidate >= 0 && candidate < plan.length; candidate += direction) {
                const entry = plan[candidate];
                expectedRoute = entry.path || origin;
                if (readRoute() !== expectedRoute) navigate(expectedRoute, { replace: true });
                const ready = await waitForTarget({
                    path: expectedRoute,
                    selector: entry.element,
                    cancelled: () => !active || request !== generation,
                });
                if (!active || request !== generation) return;
                if (!ready) continue;
                index = candidate;
                if (tour.isActive()) tour.moveTo(index);
                else tour.drive(index);
                return;
            }
            stop();
        } catch {
            if (active && request === generation) {
                stop();
                onError?.('Không mở được hướng dẫn. Vui lòng thử lại.');
            }
        } finally {
            if (active && request === generation) {
                moving = false;
                buttons(false);
            }
        }
    }

    tour = driver({
        steps: plan.map(({ element, popover }) => ({
            ...(element ? { element: () => findTarget(element) } : {}),
            popover,
        })),
        animate: false,
        smoothScroll: false,
        allowClose: true,
        allowKeyboardControl: true,
        disableActiveInteraction: true,
        skipMissingElement: false,
        popoverClass: 'web-guide-popover',
        overlayOpacity: 0.45,
        stagePadding: 6,
        stageRadius: 10,
        showProgress: true,
        progressText: '{{current}} / {{total}}',
        nextBtnText: 'Tiếp theo',
        prevBtnText: 'Quay lại',
        doneBtnText: 'Hoàn tất',
        closeBtnLabel: 'Đóng hướng dẫn',
        onNextClick: () => show(index + 1),
        onPrevClick: () => (index > 0 ? show(index - 1, -1) : undefined),
        onDoneClick: () => stop(),
        onDestroyStarted: () => stop(),
        onPopoverRender: (popover) => popover.wrapper.setAttribute('lang', 'vi'),
    });

    return {
        start: () => show(0),
        stop,
        routeChanged(path) {
            if (active && path !== expectedRoute) stop(false);
        },
    };
}
