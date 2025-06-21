import React, { useState, useEffect, useContext, useMemo } from "react"
import { View, Text, Pressable, StyleSheet, ScrollView, Button, Modal, Image } from "react-native"
import { openDatabase } from "../db/db"

const ThemeContext = React.createContext()
const themes = {
    light: { bg: "#ffffff", headerBg: "#ffffff", headerText: "#000", textPrimary: "#000", textSecondary: "#666", accent: "#ff7f00", todayAccent: "#ffeede", todayAccentBorder: "#ea6c00" },
    dark:  { bg: "#1e1e1e", headerBg: "#1e1e1e", headerText: "#fff", textPrimary: "#fff", textSecondary: "#666", accent: "#ff7f00", todayAccent: "#373330", todayAccentBorder: "#ea6c00" }
}
const ThemeProvider = ({ children }) => {
    const [mode, setMode] = useState("light")
    const toggleTheme = () => setMode(m => m === "dark" ? "light" : "dark")
    const value = useMemo(() => ({ mode, theme: themes[mode], toggleTheme }), [mode])
    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

const daysOfWeek = ["Пн","Вт","Ср","Чт","Пт","Сб","Нд"]
const monthName = ["Січень","Лютий","Березень","Квітень","Травень","Червень","Липень","Серпень","Вересень","Жовтень","Листопад","Грудень"]

const sameDay = (a, b) =>
    a && b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()

const Day = ({ day, isCurrentMonth, isToday, isStart, isEnd, inRange, hasViolation, onPress }) => {
    const { theme } = useContext(ThemeContext)
    const container = [styles.dayContainer]
    const text = [
        styles.dayText,
        { color: isCurrentMonth ? theme.textPrimary : theme.textSecondary }
    ]
    if (isToday) container.push({ borderColor: theme.todayAccentBorder, borderWidth: 3, borderRadius: 4, backgroundColor: theme.todayAccent })
    if (hasViolation) container.push({ backgroundColor: theme.accent + '33' })
    if (inRange) container.push({ backgroundColor: theme.accent + '55' })
    if (isStart || isEnd) {
        container.push({ backgroundColor: theme.accent })
        text.push({ color: theme.bg, fontWeight: 'bold' })
    }
    return (
        <Pressable style={container} onPress={() => onPress(day)}>
            <Text style={text}>{day.getDate()}</Text>
        </Pressable>
    )
}

const Calendar = () => {
    const { theme } = useContext(ThemeContext)
    const [currentDate, setCurrentDate] = useState(new Date())
    const [startDate, setStartDate] = useState(null)
    const [endDate, setEndDate] = useState(null)
    const [violations, setViolations] = useState([])
    const [todayViolations, setTodayViolations] = useState([])
    const [violationsByDate, setViolationsByDate] = useState(new Set())
    const [modalVisible, setModalVisible] = useState(false)
    const [selectedPhoto, setSelectedPhoto] = useState(null)
    const [db, setDb] = useState(null)
    const today = new Date()

    useEffect(() => {
        (async () => {
            try {
                const database = await openDatabase()
                setDb(database)
            } catch (e) {
                console.error(e)
            }
        })()
    }, [])

    const loadMonthViolations = async () => {
        if (!db) return
        try {
            const y = currentDate.getFullYear()
            const m = currentDate.getMonth()
            const start = new Date(y, m, 1).toISOString()
            const end = new Date(y, m + 1, 0, 23, 59, 59).toISOString()
            const rows = await db.getAllAsync(
                `SELECT * FROM violations WHERE date BETWEEN ? AND ?`,
                start,
                end
            )
            setViolations(rows)
            setViolationsByDate(new Set(rows.map(v => new Date(v.date).toDateString())))
        } catch (e) {
            console.error(e)
        }
    }

    const loadTodayViolations = async () => {
        if (!db) return
        try {
            const y = today.getFullYear()
            const m = today.getMonth()
            const d = today.getDate()
            const start = new Date(y, m, d).toISOString()
            const end = new Date(y, m, d, 23, 59, 59).toISOString()
            const rows = await db.getAllAsync(
                `SELECT * FROM violations WHERE date BETWEEN ? AND ?`,
                start,
                end
            )
            setTodayViolations(rows)
        } catch (e) {
            console.error(e)
        }
    }

    const refreshAll = async () => {
        await loadMonthViolations()
        await loadTodayViolations()
    }

    useEffect(() => {
        loadMonthViolations()
    }, [currentDate, db])

    useEffect(() => {
        loadTodayViolations()
    }, [db])

    const goToPrevMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))
    const goToNextMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))
    const goToToday = () => setCurrentDate(new Date())

    const onSelectDate = date => {
        if (!startDate || (startDate && endDate)) {
            setStartDate(date)
            setEndDate(null)
            return
        }
        if (!endDate) {
            if (date < startDate) {
                setEndDate(startDate)
                setStartDate(date)
            } else if (sameDay(date, startDate)) {
                setStartDate(null)
                setEndDate(null)
            } else {
                setEndDate(date)
            }
        }
    }

    const getCalendarDays = () => {
        const y = currentDate.getFullYear()
        const m = currentDate.getMonth()
        const startOfMonth = new Date(y, m, 1)
        const endOfMonth = new Date(y, m + 1, 0)
        const startDay = (startOfMonth.getDay() + 6) % 7
        const daysInMonth = endOfMonth.getDate()
        const prevEnd = new Date(y, m, 0).getDate()
        const days = []
        for (let i = startDay - 1; i >= 0; i--) {
            days.push({ date: new Date(y, m - 1, prevEnd - i), isCurrentMonth: false })
        }
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({ date: new Date(y, m, i), isCurrentMonth: true })
        }
        while (days.length < 42) {
            days.push({
                date: new Date(y, m + 1, days.length - daysInMonth - startDay + 1),
                isCurrentMonth: false
            })
        }
        return days
    }

    const calendarDays = getCalendarDays()

    let displayedViolations = []
    let listTitle = ""
    if (startDate && endDate) {
        listTitle = `Порушення ${startDate.toDateString()} - ${endDate.toDateString()}`
        displayedViolations = violations.filter(v => {
            const d = new Date(v.date)
            return d >= startDate && d <= endDate
        })
    } else if (startDate && !endDate) {
        listTitle = `Порушення за ${startDate.toDateString()}`
        displayedViolations = violations.filter(v =>
            sameDay(new Date(v.date), startDate)
        )
    } else {
        listTitle = `Сьогоднішні порушення (${today.toDateString()})`
        displayedViolations = todayViolations
    }

    return (
        <>
            <ScrollView style={[styles.calendarWrapper, { backgroundColor: theme.bg }]}>
                <View style={styles.header}>
                    <Text style={[styles.headerText, { color: theme.headerText }]}>
                        {monthName[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </Text>
                    <View style={styles.headerControls}>
                        <Pressable onPress={goToPrevMonth} style={styles.headerButton}>
                            <Text style={[styles.headerButtonText, { color: theme.headerText }]}>◀</Text>
                        </Pressable>
                        <Pressable onPress={goToNextMonth} style={styles.headerButton}>
                            <Text style={[styles.headerButtonText, { color: theme.headerText }]}>▶</Text>
                        </Pressable>
                        <Pressable onPress={goToToday} style={styles.headerButton}>
                            <Text style={[styles.todayButton, { borderColor: theme.accent, color: theme.headerText }]}>Сьогодні</Text>
                        </Pressable>
                    </View>
                </View>
                <View style={styles.daysRow}>
                    {daysOfWeek.map(d => (
                        <View key={d} style={styles.dayHeaderCell}>
                            <Text style={[styles.dayHeaderText, { color: theme.textSecondary }]}>{d}</Text>
                        </View>
                    ))}
                    {calendarDays.map(({ date, isCurrentMonth }) => {
                        const isStart = sameDay(date, startDate)
                        const isEnd = sameDay(date, endDate)
                        const inRange = startDate && endDate && date > startDate && date < endDate
                        const hasViolation = violationsByDate.has(date.toDateString())
                        return (
                            <Day
                                key={date.toDateString()}
                                day={date}
                                isCurrentMonth={isCurrentMonth}
                                isToday={sameDay(date, today)}
                                isStart={isStart}
                                isEnd={isEnd}
                                inRange={inRange}
                                hasViolation={hasViolation}
                                onPress={onSelectDate}
                            />
                        )
                    })}
                </View>
                <Button title="Рефреш" onPress={refreshAll} />
                <View style={styles.violationsList}>
                    <Text style={[styles.listTitle, { color: theme.textPrimary }]}>{listTitle}</Text>
                    {displayedViolations.map(v => (
                        <View key={v.id} style={[styles.violationItem, { borderColor: theme.accent, backgroundColor: theme.headerBg }]}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.violationCategory, { color: theme.accent }]}>{v.category}</Text>
                                <Text style={[styles.violationDesc, { color: theme.textPrimary }]}>{v.description}</Text>
                            </View>
                            <Button
                                title="Див. фото"
                                onPress={() => {
                                    setSelectedPhoto(v.imageUri)
                                    setModalVisible(true)
                                }}
                            />
                        </View>
                    ))}
                </View>
            </ScrollView>
            <Modal visible={modalVisible} transparent onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <Image source={{ uri: selectedPhoto }} style={styles.modalImage} resizeMode="contain"/>
                    <Button title="Закрити" onPress={() => setModalVisible(false)}/>
                </View>
            </Modal>
        </>
    )
}

const CalendarScreen = () => (
    <ThemeProvider>
        <Calendar />
    </ThemeProvider>
)
export default CalendarScreen

const styles = StyleSheet.create({
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        borderRadius: 12,
    },
    headerButton: {
        padding: 8,
        marginLeft: 4,
    },
    headerControls: {
        flexDirection: "row",
        alignItems: "center",
    },
    headerButtonText: {
        fontSize: 22,
    },
    headerText: {
        fontSize: 20,
        fontWeight: "bold",
    },
    calendarWrapper: {
        flex: 1,
        padding: 8,
    },
    daysRow: {
        flexDirection: "row",
        flexWrap: "wrap",
    },
    dayContainer: {
        width: "14.28%",
        height: 48,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 4,
    },
    dayText: {
        fontSize: 16,
        textAlign: "center",
    },
    dayHeaderCell: {
        width: "14.28%",
        alignItems: "center",
        paddingVertical: 8,
    },
    dayHeaderText: {
        fontSize: 12,
        fontWeight: "600",
    },
    todayButton: {
        fontSize: 13,
        fontWeight: "bold",
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderWidth: 2,
        borderRadius: 20,
    },
    violationsList: {
        padding: 16,
    },
    listTitle: {
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 8,
    },
    violationItem: {
        flexDirection: 'row',
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
        alignItems: 'center',
    },
    violationCategory: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    violationDesc: {
        fontSize: 12,
        marginBottom: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalImage: {
        width: '100%',
        height: '80%',
        borderRadius: 8,
        marginBottom: 20,
    },
})
