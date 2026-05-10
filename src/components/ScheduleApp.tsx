"use client";

import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import { Hero } from "./Hero";
import { Timeline } from "./Timeline";
import { WeekOverview } from "./WeekOverview";
import { SubjectAnalytics } from "./SubjectAnalytics";
import { QuickActions } from "./QuickActions";
import { ClassPicker } from "./ClassPicker";
import { CommandPalette } from "./CommandPalette";
import { DirectoryPanel } from "./DirectoryPanel";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";
import { SelectedDay } from "./SelectedDay";
import { LoadingShell } from "./LoadingShell";
import { WeekPager } from "./WeekPager";
import { EmptyWeekState } from "./EmptyWeekState";
import { useStore } from "@/store/useStore";
import { useScheduleQuery } from "@/hooks/useSchedule";
import { todayInSchoolTz } from "@/lib/now";
import { homeworkStats } from "@/lib/homework";
import { shiftIsoDate, weekRangeOf } from "@/lib/schedule/calendar";

export function ScheduleApp() {
  const hydrated = useHydrated();
  const selectedClass = useStore((s) => s.selectedClass);
  const group = useStore((s) => s.group);
  const setSelectedClass = useStore((s) => s.setSelectedClass);
  const setGroup = useStore((s) => s.setGroup);
  const hasOnboarded = useStore((s) => s.hasOnboarded);
  const homeworkDone = useStore((s) => s.homeworkDone);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [directoryKind, setDirectoryKind] = useState<"teachers" | "rooms" | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"today" | "week" | "analytics">("today");
  /** 0 = published week (real data); ±N = navigate that many weeks. */
  const [weekShift, setWeekShift] = useState(0);

  const todayRef = useRef<HTMLDivElement>(null);
  const weekRef = useRef<HTMLDivElement>(null);
  const analyticsRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, error } = useScheduleQuery({
    className: selectedClass,
    weekId: undefined,
  });

  const week = data?.schedule ?? null;
  const source = data?.source ?? null;

  const today = todayInSchoolTz();

  // Week navigation. The published week is whatever the parser produced.
  // viewedRange is the [Mon, Sun] range the user is currently looking at.
  const publishedRange = useMemo(
    () => (week ? weekRangeOf(week.weekStart) : null),
    [week],
  );
  const viewedRange = useMemo(() => {
    if (!publishedRange) return null;
    if (weekShift === 0) return publishedRange;
    return weekRangeOf(shiftIsoDate(publishedRange.weekStart, weekShift * 7));
  }, [publishedRange, weekShift]);
  const isPublishedWeek = weekShift === 0;
  const visibleWeek = isPublishedWeek ? week : null;

  // Derive at render time — no setState in effect.
  // If today's date is in the visible week, default to highlighting it;
  // otherwise default to the first day in the week (so we never claim
  // "today is Monday" when the user is on a weekend / outside the week).
  const effectiveSelectedDate = useMemo(() => {
    if (selectedDate) return selectedDate;
    if (!visibleWeek) return null;
    const todayDay = visibleWeek.days.find((d) => d.date === today.iso);
    if (todayDay) return todayDay.date;
    return visibleWeek.days[0]?.date ?? null;
  }, [selectedDate, visibleWeek, today.iso]);

  const hwStats = useMemo(
    () => homeworkStats(visibleWeek, group, homeworkDone),
    [visibleWeek, group, homeworkDone],
  );

  function changeWeek(delta: number) {
    setSelectedDate(null);
    setWeekShift((s) => s + delta);
  }
  function resetWeek() {
    setSelectedDate(null);
    setWeekShift(0);
  }

  function scrollToSection(id: "today" | "week" | "analytics") {
    setActiveTab(id);
    const el = id === "today" ? todayRef.current : id === "week" ? weekRef.current : analyticsRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top, behavior: "smooth" });
  }

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-6xl px-4 md:px-6 py-6 md:py-10">
        <LoadingShell />
      </div>
    );
  }

  if (!selectedClass || !hasOnboarded) {
    return (
      <Onboarding
        onPick={(c) => {
          setSelectedClass(c);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar
        className={selectedClass}
        group={group}
        source={source}
        week={week}
        onChangeClass={() => setPickerOpen(true)}
        onOpenCommand={() => setPaletteOpen(true)}
      />
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 md:px-6 py-5 md:py-10 pb-24 lg:pb-12 space-y-8">
        {error && (
          <div className="rounded-2xl border border-[color:var(--color-danger)]/30 bg-[color:var(--color-danger)]/8 px-4 py-3 text-sm text-fg">
            Не удалось загрузить расписание: {(error as Error).message}
          </div>
        )}

        {isLoading && !data ? (
          <LoadingShell />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="space-y-8"
          >
            {viewedRange && (
              <WeekPager
                range={viewedRange}
                shift={weekShift}
                hasData={isPublishedWeek}
                onShift={changeWeek}
                onReset={resetWeek}
              />
            )}

            {isPublishedWeek ? (
              <>
                <Hero week={visibleWeek} group={group} className={selectedClass} />

                <QuickActions
                  group={group}
                  onSetGroup={setGroup}
                  onOpenCommand={() => setPaletteOpen(true)}
                  onScrollTo={scrollToSection}
                  onOpenTeachers={() => setDirectoryKind("teachers")}
                  onOpenRooms={() => setDirectoryKind("rooms")}
                  homeworkRemaining={hwStats.remaining}
                />

                <div ref={todayRef} className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
                  <Timeline week={visibleWeek} group={group} />
                  <SelectedDay
                    week={visibleWeek}
                    group={group}
                    date={effectiveSelectedDate}
                    onClose={() => setSelectedDate(null)}
                    onChangeDate={(iso) => setSelectedDate(iso)}
                  />
                </div>

                <div ref={weekRef}>
                  <WeekOverview
                    week={visibleWeek}
                    group={group}
                    selectedDate={selectedDate}
                    onSelectDate={(iso) => {
                      setSelectedDate(iso);
                      setActiveTab("today");
                      todayRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                  />
                </div>

                <div ref={analyticsRef}>
                  <SubjectAnalytics week={visibleWeek} group={group} />
                </div>
              </>
            ) : (
              viewedRange && (
                <EmptyWeekState
                  range={viewedRange}
                  shift={weekShift}
                  onReset={resetWeek}
                />
              )
            )}

            <Footer source={source} parsedAt={week?.parsedAt} />
          </motion.div>
        )}
      </main>

      <BottomNav
        active={activeTab}
        onChange={scrollToSection}
        onOpenCommand={() => setPaletteOpen(true)}
        onOpenClasses={() => setPickerOpen(true)}
      />

      <ClassPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(c) => setSelectedClass(c)}
        title="Выбери другой класс"
        subtitle="Расписание загрузится сразу — переключение мгновенное."
      />

      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        week={week}
        group={group}
        onPickDay={(iso) => {
          setSelectedDate(iso);
          todayRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
        onChangeClass={() => setPickerOpen(true)}
        onChangeGroup={setGroup}
      />

      <DirectoryPanel
        open={directoryKind !== null}
        onClose={() => setDirectoryKind(null)}
        kind={directoryKind ?? "teachers"}
        week={week}
        group={group}
      />
    </div>
  );
}

function useHydrated(): boolean {
  return useSyncExternalStore(noopSubscribe, getTrue, getFalse);
}

function noopSubscribe() {
  return () => undefined;
}
function getTrue() {
  return true;
}
function getFalse() {
  return false;
}

function Onboarding({ onPick }: { onPick: (className: string) => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <ClassPicker
        open
        onClose={() => undefined}
        onSelect={onPick}
        title="МАОУ СОШ №57 · расписание"
        subtitle="Премиум-просмотрщик расписания. Выбери свой класс — данные грузятся напрямую с keo.gov39.ru."
      />
    </div>
  );
}

function Footer({
  source,
  parsedAt,
}: {
  source: { fromFixture: boolean; url: string } | null;
  parsedAt: string | undefined;
}) {
  return (
    <footer className="pt-8 pb-4 text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-fg-muted)] flex flex-wrap items-center gap-x-4 gap-y-2">
      <span>МАОУ СОШ №57 · klgd1548141601</span>
      {source?.url && (
        <a
          href={source.url}
          target="_blank"
          rel="noreferrer noopener"
          className="hover:text-fg"
        >
          источник: keo.gov39.ru
        </a>
      )}
      {source?.fromFixture && (
        <span className="text-[color:var(--color-warn)]/80">
          фикстуры · сайт-источник недоступен с этого инстанса
        </span>
      )}
      {parsedAt && (
        <span className="ml-auto tabular-nums">обновлено · {parsedAt.slice(11, 16)}</span>
      )}
    </footer>
  );
}
