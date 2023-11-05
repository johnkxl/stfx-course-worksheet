import pandas as pd
from pandasql import sqldf
from datetime import datetime


TIMEBLOCK_FILE = "timeblockgrid.csv"
COURSES_FILE = "stfx-tbl-copy.csv"
CSCI_COURSES_FILE = "stfx-tbl-csci.csv"

TIME_FORMAT = '%I:%M %p'


def load_timeblocks(file: str):
    timeblocks = pd.read_csv(file)    
    return timeblocks

def timeblocks_between(day: str, time1: str="8:30 AM", time2: str="10:00 PM", method=None):
    earliest = format_time(time1)
    latest = format_time(time2)

    timeblocks_in_range = sqldf(f'''SELECT *
                                      FROM timeblocks_df
                                     WHERE Day = '{day}'
                                       AND ( ( Start_time >= '{earliest}'
                                       AND Start_time <= '{latest}' )
                                       OR  ( End_time >= '{earliest}' 
                                       AND End_time <= '{latest}' ) )
                                ''')
    
    if method == "list":
        all_timeblocks = [row[1].Timeblock for row in timeblocks_in_range.iterrows()]
        return all_timeblocks

    return timeblocks_in_range


def filter_courses_by_dept(dept: str=False):
    if not dept:
        department_filter = ""
    else:
        department_filter = f"WHERE COURSE LIKE '%{dept}%'"

    courses_found = sqldf(f'''SELECT *
                                FROM all_courses
                                {department_filter}
                                ''')
    return courses_found

def format_time(time):
    meridiem = time.split()
    hour_minutes = meridiem[0].split(':')
    hour = int(hour_minutes[0])
    minutes = hour_minutes[1]

    if meridiem[1].upper() == "AM":
        hour = (hour + 12) % 12
    else:
        hour = hour % 12 + 12

    formatted_time = f"{hour :02d}:{minutes}:00"

    return formatted_time



    query = sqldf('''
                SELECT *
                FROM timeblocks_df
                WHERE Day = 'Monday'
                AND End_time >= '12:45:00'
                ORDER BY End_time ASC
                ''')

    for row in query.iterrows():
        print(row[1])


def print_courses(course_df):
    for row in course_df.iterrows():
        course = row[1]
        print(f"{course.CRN} {course.COURSE :12} {course.TITLE :30} {course.PROFS :20} {str(course.ROOM) :8} {course.TERM :4} {course.TIMEBLOCK}")



def select_course(course_CRN, course_dict, taken) -> tuple:
    course = sqldf(f'''  SELECT *
                          FROM filtered_courses_df
                         WHERE CRN = {course_CRN}
                    ''')
    from copy import deepcopy
    new_dict = deepcopy(course_dict)
    course_object = Course(course.iloc[0])
    #course_code = course_object.course
    new_dict[course_CRN] = course_object

    taken = taken.union(course_object.timeblock)

    return new_dict, taken


def remove_course(course_CRN, course_dict, taken):
    new_set = taken.copy()
    new_set.difference_update(course_dict[course_CRN].timeblock)
    new_dict = course_dict.copy()
    new_dict.pop(course_CRN)
    return new_dict, new_set


def when_is_timeblock(block: str) -> tuple:
    block_data = sqldf(f'''SELECT Day, Start, End
                             FROM timeblocks_df
                            WHERE Timeblock = '{block}'
                       ''')
    block_record = block_data.iloc[0]

    day, start, end = block_record.Day, block_record.Start, block_record.End
    return day, start, end


def concurrent_timeblocks(timeblock: str) -> list[str]:
    day, start, end = when_is_timeblock(timeblock)
    conflicts = timeblocks_between(day, start, end, "list")
    return conflicts


#-----
def create_timeblock_filter_clause(timeblock):
    return f"TIMEBLOCK NOT LIKE '%{timeblock}%'\n"


def join_filter_clauses(taken):
    timeblock_filter = []
    for timeblock in taken:
        timeblock_filter.append(create_timeblock_filter_clause(timeblock))
    
    if len(timeblock_filter) > 0:
        filter_string = "\nWHERE " + "AND ".join(timeblock_filter)
        return filter_string
    else:
        return ""


def load_available_courses(taken):
    timeblock_query = f'''SELECT *
                          FROM filtered_courses_df{join_filter_clauses(taken)}
                        '''
    new_options = sqldf(timeblock_query)
    return new_options
#-----

class Course:

    def __init__(self, course_record):
        self.crn = course_record.CRN
        self.course = course_record.COURSE
        self.title = course_record.TITLE
        self.prof = course_record.PROFS
        self.room = course_record.ROOM
        self.term = course_record.TERM
        self.timeblock = set((course_record.TIMEBLOCK).split('/'))

    def course_times(self):
        times = []
        for block in self.timeblock:
            block_data = when_is_timeblock(block)
            day_dict = {"Day": block_data[0], "Start": block_data[1], "End": block_data[2]}
            times.append(day_dict)
        times = tuple(times)
        return times

    def conflicting_timeblocks(self):
        all_conflicts = set()
        for timeblock in self.timeblock:
            all_conflicts = all_conflicts.union(concurrent_timeblocks(timeblock))
        return all_conflicts

    def has_conflict(self, other: "Course") -> bool:
        return not self.conflicting_timeblocks().isdisjoint(other.timeblock)

        # for day_data in self.course_times():
        #     this_course_intersections = set(timeblocks_between(day_data["Day"], day_data["Start"], day_data["End"], "list"))
        #     if len(this_course_intersections.intersection(other.timeblock)) > 0:
        #         return True    
        # return False
        pass
    
    def __repr__(self):
        timeblocks_list = [block for block in self.timeblock]
        timeblocks_list.sort()
        timeblocks_repr = '/'.join(timeblocks_list)
        course_info = f"Course(CRN={self.crn} code={self.course} title={self.title} prof={self.prof} room={self.room} term={self.term} timeblocks={timeblocks_repr})"
        return course_info


class CourseSchedule:

    def __init__(self):
        self.courses = {}
        self.timeblocks = set()
    
    def add(self, course: Course):
        if course.timeblock.isdisjoint(self.timeblocks) or len(self.timeblocks) == 0:
            self.courses.update({course.crn : course})
            self.timeblocks = self.timeblocks.union(course.conflicting_timeblocks())
        else:
            print("Unable to add course")
        pass
    
    def __repr__(self):
        course_schedule = ""
        for course in self.courses.values():
            course_schedule += str(course) + '\n'
        return course_schedule




# MAIN PROGRAM
if __name__ == "__main__":
    timeblocks_df = load_timeblocks(TIMEBLOCK_FILE)
    all_courses = pd.read_csv(COURSES_FILE)
    filtered_courses_df = filter_courses_by_dept("CSCI")

    selected_courses = {}
    taken_timeblocks = set()


    my_schdule = CourseSchedule()
    course_object1 = Course(filtered_courses_df.iloc[0])
    course_object2 = Course(filtered_courses_df.iloc[14])
    course_object3 = Course(filtered_courses_df.iloc[28])

    print(f"Course Objects:\n{course_object1}\n{course_object2}\n{course_object3}\n")

    # print(course_object1)
    # print(course_object1.conflicting_timeblocks().union(course_object2.conflicting_timeblocks()))
    print(my_schdule.timeblocks)
    my_schdule.add(course_object3)
    print(my_schdule.timeblocks)
    my_schdule.add(course_object2)
    print(my_schdule.timeblocks)
    my_schdule.add(course_object1)



    print(my_schdule)
    # print(course_object1.has_conflict(course_object2))
    # print(course_object1.has_conflict(course_object3))
    # print(course_object3.has_conflict(course_object2))

    # monday = timeblocks_between("Monday", "8:30 AM", "11:00 AM")
    # print(monday)


    run_program = False

    while run_program:
        print_courses(filtered_courses_df)

        while True:
            action = input('\n"add"\t"remove"\t"quit"\n')

            if action == "add":
                course_to_add = input("CRN of course to add: ")
                selected_courses, taken_timeblocks = select_course(course_to_add, selected_courses, taken_timeblocks)
                break
            elif action == "remove":
                course_to_remove = input("CRN of course to remove from selection: ")
                selected_courses, taken_timeblocks = remove_course(course_to_remove, selected_courses, taken_timeblocks)
                break
            elif action == "quit":
                exit()
            else:
                continue

        for key in selected_courses:
            course = selected_courses[key]
            print(f"{course.course} {course.title}")
        print(taken_timeblocks)
        print("\n")
        
        
        accepted_input = False
        while not accepted_input:
            up_next = input("continue\tor\tquit ?\n")

            if up_next == "continue":
                filtered_courses_df = load_available_courses(taken_timeblocks)
                accepted_input = True
            elif up_next == "quit":
                exit()
            else:
                continue






#print_courses(filtered_courses_df)
#some_course = Course(filtered_courses_df.iloc[13])
#data_science = Course(filtered_courses_df.iloc[32])
#print(some_course.title, some_course.course_times())
#print(data_science.title, data_science.course_times())
#print(some_course.has_conflict(data_science))
#print(timeblocks_between("Monday", "9:30 am", "10:20 am", "list"))
#print(timeblocks_between("Monday", "10:00 am", "11:15 am" ,"list"))
# print(query.COURSE)
assert set(concurrent_timeblocks('Z4')) == {'L4', 'A5', 'Z4'}
assert set(concurrent_timeblocks('A1')) == {'A1', 'U1'}