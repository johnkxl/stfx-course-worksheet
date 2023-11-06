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
    """
    Returns all time blocks occuring between two times on a given day. 

    :param day: Day of timeblocks.
    :type day: str
    :param time1: Earliest time for timeblocks to occur.
    :type time1: str
    :param time2: Latest time for timeblocks to occur.
    :type time2: str
    :param medthod: If specified as "list", returns a list instead of a pandas dataframe.
    :return: All timeblocks within the range of time1 and time2.
    :rtype: Pandas DataFrame (default)
            list (method="list")
    """

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
    """
    Returns a Pandas DataFrame with all courses in a specified deparment.

    :param dept: The department to filter the courses. e.g. "CSCI"
    :type dept: str
    :return: DataFrame with only courses from the specified department.
    :rtype: Pandas DataFrame
    """
    if not dept:
        department_filter = ""
    else:
        department_filter = f"WHERE COURSE LIKE '%{dept}%'"

    courses_found = sqldf(f'''SELECT *
                                FROM all_courses
                                {department_filter}
                                ''')
    return courses_found

def format_time(time: str) -> str:
    """
    Format a time from "HH:MM PM" to 24-hour time with structure '00:00:00'.

    :param time: The time to format.
    :type time: str
    :return: 24-hour formatted time '00:00:00'
    :rtype: str
    """
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
    """
    Print all courses in a DataFrame in the terminal.

    :param course_df: DataFrame of courses to display.
    :type course_df: Pandas DataFrame
    :return: Do not return anything.
    :rtype: None
    """
    for row in course_df.iterrows():
        course = row[1]
        print(f"{course.CRN} {course.COURSE :12} {course.TITLE :30} {course.PROFS :20} {str(course.ROOM) :8} {course.TERM :4} {course.TIMEBLOCK}")



def select_course(course_CRN) -> "Course":
    """
    Creates and returns a Course object from the record matching the input CRN in the filtered courses DataFrame.

    :param course_CRN: The unique 6-digit CRN of the selected course.
    :type course_CRN: str
    :return: A Course object corresponding to the CRN.
    :rtype: Course
    """
    course = sqldf(f'''  SELECT *
                          FROM filtered_courses_df
                         WHERE CRN = {course_CRN}
                    ''')
    course_object = Course(course.iloc[0])
    return course_object


def remove_course(course_CRN, course_dict, taken):
    """
    OUTDATED. TO BE DELTED.
    """
    new_set = taken.copy()
    new_set.difference_update(course_dict[course_CRN].timeblock)
    new_dict = course_dict.copy()
    new_dict.pop(course_CRN)
    return new_dict, new_set


def when_is_timeblock(block: str) -> tuple:
    """
    Returns the day, the beginning and end times of a timeblock.

    :param block: The timeblock to convert into its occurence.
    :type block: str
    :return: The day, start, and end times of the timeblock.
    :rtype: Tuple(str, str, str)
    """
    block_data = sqldf(f'''SELECT Day, Start, End
                             FROM timeblocks_df
                            WHERE Timeblock = '{block}'
                       ''')
    block_record = block_data.iloc[0]

    day, start, end = block_record.Day, block_record.Start, block_record.End
    return day, start, end


def concurrent_timeblocks(timeblock: str) -> list[str]:
    """
    Find all timeblocks that occur at the same time on the same day as a given timeblock.

    :param timeblock: Timeblock to search for conflicts.
    :type timeblock: str
    :return: A list of all timeblocks, including the input, occuring during the time range of the input timeblock.
    :rtype: list[str]
    """
    day, start, end = when_is_timeblock(timeblock)
    conflicts = timeblocks_between(day, start, end, "list")
    return conflicts


#-----
def create_timeblock_filter_clause(timeblock):
    """
    Create the SQL clause for filtering out courses with a timeblock.

    :param timeblock: A timeblock to exclude from a query.
    :type timeblock: str
    :return: An SQL clause
    :rtype: str
    """
    return f"TIMEBLOCK NOT LIKE '%{timeblock}%'\n"


def join_filter_clauses(taken):
    """
    Return a string of all SQL clauses for excluding timeblocks.

    :param taken: A set of all the timeblocks to filter out of the DataFrame
    :type taken: set
    :return: a string of all timeblock-exclusion clauses 
    :rtype: str
    """
    timeblock_filter = []
    for timeblock in taken:
        timeblock_filter.append(create_timeblock_filter_clause(timeblock))
    
    if len(timeblock_filter) > 0:
        filter_string = "\nWHERE " + "AND ".join(timeblock_filter)
        return filter_string
    else:
        return ""


def load_available_courses(taken):
    """
    Returns a Pandas DataFrame conrtaining courses with a set of timeblocks filtered out.

    :param taken: A set of all the timeblocks to filter out of the DataFrame
    :type taken: set
    :return: A DataFrame of courses not occurpying the speicified set of timeblocks
    :rtype: Pandas DataFrame
    """
    timeblock_query = f'''SELECT *
                          FROM filtered_courses_df{join_filter_clauses(taken)}
                        '''
    new_options = sqldf(timeblock_query)
    return new_options
#-----

class Course:
    """
    Class for storing course information for the purpose of creating a schedule within the CourseSchedule class.
    """

    def __init__(self, course_record):
        self.crn = course_record.CRN
        self.course = course_record.COURSE
        self.title = course_record.TITLE
        self.prof = course_record.PROFS
        self.room = course_record.ROOM
        self.term = course_record.TERM
        self.timeblock = set((course_record.TIMEBLOCK).split('/'))

    def course_times(self):
        """
        Convert and return the course's timeblocks into a days and times of the occurence.

        :return: Days and times the course occurs
        :rtype: tuple(dict) 
        """
        times = []
        for block in self.timeblock:
            block_data = when_is_timeblock(block)
            day_dict = {"Day": block_data[0], "Start": block_data[1], "End": block_data[2]}
            times.append(day_dict)
        times = tuple(times)
        return times

    def conflicting_timeblocks(self):
        """
        Returns the course's timeblocks and all timeblocks that conflict with the course's timeblocks.

        :return: A collection of course's timeblocks and conflictig timeblocks
        :rtype: set
        """
        all_conflicts = set()
        for timeblock in self.timeblock:
            all_conflicts = all_conflicts.union(concurrent_timeblocks(timeblock))
        return all_conflicts

    def has_conflict(self, other: "Course") -> bool:
        """
        Check if this course occurs at the same time as another course.

        :param other: The Course object to compare course occurences to.
        :type other: Course
        :return: True if the courses conflict; False, if no conflict.
        :rtype: boolean
        """
        return not self.conflicting_timeblocks().isdisjoint(other.timeblock)
    
    def __repr__(self):
        """
        Returns a string representation of the Course object. The string is "CRN, code, title, prof, room, term, timblock".

        :return: A string representation of the Course object of the form "CRN, code, title, prof, room, term, timblock".
        :rtype: String
        """
        timeblocks_list = [block for block in self.timeblock]
        timeblocks_list.sort()
        timeblocks_repr = '/'.join(timeblocks_list)
        course_info = f"Course(CRN={self.crn} code={self.course} title={self.title} prof={self.prof} room={self.room} term={self.term} timeblocks={timeblocks_repr})"
        return course_info


class CourseSchedule:
    """
    Class for managing a collection of Course object in a schedule. The class maintains a dictionary of added Course Objects,
    with their CRNs as the keys, and a set of all timeblocks occupied in the schedule. The class provides the functionality for 
    adding, removing, checking if a Course is added, and determining all the timeblocks that would conflict with the sschedule.
    """

    def __init__(self):
        self._courses = {}
        self._timeblocks = set()
    
    def add(self, course: Course):
        """
        Add a Course Object to the Course Schedule, indexed by its CRN as a key.
        If the course has timeblock conflicts, "Unable to add course" will be output to the terminal
        and the course will not be added.

        :param course: Course Object to add to the collection
        :type course; Course Object
        """
        if course.timeblock.isdisjoint(self.conflicting_timeblocks()) or len(self._timeblocks) == 0:
            self._courses.update({course.crn : course})
            self._timeblocks = self._timeblocks.union(course.timeblock)
        else:
            print("Unable to add course")
    
    def remove(self, course: Course):
        """
        Remove a Course Object from the Course Schedule. If the Course does not exist in the schedule,
        return "Course not in schedule."

        :param course: Course Object to remove from Course Schdule
        :type course: Course Object
        :return: Wether the course could be removed
        :rtype: String
        """
        if self.find(course):
            removed_course = self._courses.pop(course.crn)
            self._timeblocks.difference_update(removed_course.timeblock)
            return "Course removed."
        return "Course not in schedule."
    
    def find(self, course: Course):
        """
        Check if a Course Object exists in the Course Schedule

        :param course: Courses Obejct to check if in the collection
        :type course: Course Object
        :return: True if the Course is in the schedule; False if not in the schedule
        :rtype: boolean
        """
        crn = course.crn
        return crn in self._courses.keys()

    def conflicting_timeblocks(self):
        """
        Return a set of all timeblocks that conflict with the Courses contained in the Course Schedule.

        :return: A set of all timeblocks that conflict with the timeblocks of the Courses in the schedule
        :rtype: set
        """
        all_conflicts = set()
        for timeblock in self._timeblocks:
            all_conflicts = all_conflicts.union(concurrent_timeblocks(timeblock))
        return all_conflicts
    
    def __repr__(self):
        """
        Returns a string representation of the Course Schedule; the string representations of all the courses contained in the
        schedule, each on its own line.

        :return: A string represenations of the Course Schedule
        :rtype: String
        """
        course_schedule = ""
        for course in self._courses.values():
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
    # course_object1 = Course(filtered_courses_df.iloc[0])
    # course_object2 = Course(filtered_courses_df.iloc[14])
    # course_object3 = Course(filtered_courses_df.iloc[28])

    # print(f"Course Objects:\n{course_object1}\n{course_object2}\n{course_object3}\n")

    # print(course_object1)
    # print(course_object1.conflicting_timeblocks().union(course_object2.conflicting_timeblocks()))
    # print(my_schdule._timeblocks)
    # my_schdule.add(course_object3)
    # print(my_schdule._timeblocks)
    # my_schdule.add(course_object2)
    # print(my_schdule._timeblocks)
    # my_schdule.add(course_object1)



    # print(my_schdule)
    # print(course_object1.has_conflict(course_object2))
    # print(course_object1.has_conflict(course_object3))
    # print(course_object3.has_conflict(course_object2))

    # monday = timeblocks_between("Monday", "8:30 AM", "11:00 AM")
    # print(monday)


    run_program = True

    while run_program:
        print_courses(filtered_courses_df)

        while True:
            action = input('\n"add"\t"remove"\t"quit"\n')

            if action == "add":
                course_to_add = input("CRN of course to add: ")
                course_selected = select_course(course_to_add)
                print(course_selected)
                print(f"Add {course_selected.course} {course_selected.title} to your schedule?")
                
                answered = False
                while not answered:
                    answer = input()
                    if answer == "yes" or answer == 'y':
                        my_schdule.add(course_selected)
                        answered = True
                    elif answer == "no" or answer == 'n':
                        answered = True

                break
            elif action == "remove":
                course_to_remove = input("CRN of course to remove from selection: ")
                course_selected = select_course(course_to_remove)
                print(course_selected)
                print(f"Remove {course_selected.course} {course_selected.title} from your schedule?")
                
                answered = False
                while not answered:
                    answer = input()
                    if answer == "yes" or answer == 'y':
                        my_schdule.remove(course_selected)
                        answered = True
                    elif answer == "no" or answer == 'n':
                        answered = True
                break
            elif action == "quit":
                exit()
            else:
                continue
        print(my_schdule)
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